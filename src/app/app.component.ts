import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { io, Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'collaborative_whiteboard';
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  private context!: CanvasRenderingContext2D;
  private socket!: Socket;

  private drawing = false;
  private color = '#000000';
  private lineWidth = 5;
  private lastX = 0;
  private lastY = 0;

  constructor() { }

  ngOnInit() {
    this.context = this.canvas.nativeElement.getContext('2d')!;
    this.socket = io('http://localhost:3000');

    this.socket.on('user-id', (userId: string) => {
      console.log(`My user ID is ${userId}`);
      this.socket.emit('new-user', prompt('Please enter your name:'));
    });

    this.socket.on('user-connected', (userName: string) => {
      console.log(`${userName} connected`);
    });

    this.socket.on('draw', (data) => {
      this.draw(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth);
    });

    this.socket.on('clear', () => {
      this.clearCanvas();
    });

    this.socket.on('user-disconnected', (userName: string) => {
      console.log(`${userName} disconnected`);
    });

  }

  ngOnDestroy() {
    this.socket.disconnect();
  }

  onMouseDown(event: MouseEvent) {
    this.drawing = true;
    this.lastX = event.clientX - this.canvas.nativeElement.offsetLeft;
    this.lastY = event.clientY - this.canvas.nativeElement.offsetTop;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.drawing) {
      return;
    }
    const currentX = event.clientX - this.canvas.nativeElement.offsetLeft;
    const currentY = event.clientY - this.canvas.nativeElement.offsetTop;
    this.draw(this.lastX, this.lastY, currentX, currentY, this.color, this.lineWidth);
    this.socket.emit('draw', {
      x0: this.lastX,
      y0: this.lastY,
      x1: currentX,
      y1: currentY,
      color: this.color,
      lineWidth: this.lineWidth
    });
    this.lastX = currentX;
    this.lastY = currentY;
  }

  onMouseUp(event: MouseEvent) {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
  }

  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

  draw(x0: number, y0: number, x1: number, y1: number, color: string, lineWidth: number) {
    const distance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    const angle = Math.atan2(y1 - y0, x1 - x0);

    for (let i = 0; i < distance; i += 5) {
      const x = x0 + Math.cos(angle) * i;
      const y = y0 + Math.sin(angle) * i;
      this.context.beginPath();
      this.context.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
      this.context.fillStyle = color;
      this.context.fill();
    }
  }

  setColor(color: string) {
    this.color = color;
  }

  setLineWidth(lineWidth: number) {
    this.lineWidth = lineWidth;
  }

  clear() {
    this.clearCanvas();
    this.socket.emit('clear');
  }
}
