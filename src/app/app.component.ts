import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { io, Socket } from 'socket.io-client';

enum Tool {
  Pen,
  Eraser
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy{

  title = 'collaborative_whiteboard';
  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  @ViewChild('messagesContainer', { static: true })
  private messagesContainer!: ElementRef<HTMLDivElement>;

  public tool: Tool = Tool.Pen;
  public eraserSize = 40

  private context!: CanvasRenderingContext2D;
  private socket!: Socket;
  private drawing = false;
  public color = '#000000';
  public lineWidth = 10;
  private lastX = 0;
  private lastY = 0;

  private textInput = document.createElement('input');
  public text = '';
  public chatText = '';
  private textX = 0;
  private textY = 0;
  private textEditing = false;
  public textSize = 20;

  messages: { user: string, chatText: string }[] = [];

  onlineUsers: string[] = [];

  showConfirmation = false;
  confirmType: 'chat' | 'canvas' = 'chat';

  ngOnInit() {
    this.showConfirmation = false;

    this.context = this.canvas.nativeElement.getContext('2d')!;

    //this.socket = io('http://localhost:3000/'); //Wenn Lokale Ausführung dann den unteren auskommentieren
    this.socket = io('https://collaborative-whiteboard-gr03.herokuapp.com/');

    this.socket.on('user-id', (userId: string) => {
      console.log(`My user ID is ${userId}`);
      this.socket.emit('new-user', prompt('Please enter your username:'));
    });

    this.socket.on('user-connected', (userName: string) => {
      console.log(`${userName} connected`);
    });

    this.socket.on('invalid-username', () => {
      const newUserName = prompt('The username you entered is already in use or is empty! Please choose another username: ');
      this.socket.emit('new-user', newUserName);
    });

    this.socket.on('online-users', (users: string[]) => {
      this.onlineUsers = users;
    });

    this.socket.on('draw', (data) => {
      this.draw(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth);
    });

    this.socket.on('text', (data) => {
      this.context.font = `${data.fontSize}px Arial`;
      this.context.fillStyle = data.color;
      this.context.fillText(data.text, data.x, data.y);
    });

    this.canvas.nativeElement.addEventListener('dblclick', (event) => this.onDoubleClick(event));
    document.addEventListener('mousedown', (event) => this.onMouseDownText(event));
    document.addEventListener('mousemove', (event) => this.onMouseMoveText(event));
    document.addEventListener('keydown', (event) => this.onKeyDown(event));
    document.addEventListener('mouseup', (event) => this.onMouseUp(event));

    this.socket.on('chat-message', (message: { user: string, chatText: string }) => {
      this.messages.push(message);
      this.scrollChatToBottom();
    });

    this.socket.on('erase', (data) => {
      this.erase(data.x, data.y);
    });

    this.socket.on('clear', () => {
      this.clearCanvas();
    });

    this.socket.on('clear-chat', () => {
      this.clearChatMessages();
    });

    this.socket.on('user-disconnected', (userName: string) => {
      console.log(`${userName} disconnected`);
    });
  }

  ngOnDestroy() {
    this.socket.disconnect();
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

  erase(x: number, y: number) {
    const eraserRadius = this.eraserSize;
    this.context.beginPath();
    this.context.arc(x, y, eraserRadius, 0, Math.PI * 2);
    this.context.fillStyle = '#ffffff';
    this.context.globalCompositeOperation = 'destination-out';
    this.context.fill();
    this.context.globalCompositeOperation = 'source-over';
  }


  sendMessage() {
    if (this.chatText.trim().length > 0) {
      this.socket.emit('chat-message', this.chatText);
      this.chatText = '';
    }
  }

  private scrollChatToBottom() {
    setTimeout(() => {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }, 0);
  }

  onMouseMove(event: MouseEvent) {
    if (!this.drawing) {
      return;
    }
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const currentX = event.clientX - rect.left;
    const currentY = event.clientY - rect.top;
    if (this.tool === Tool.Pen) {
      this.draw(this.lastX, this.lastY, currentX, currentY, this.color, this.lineWidth);
      this.socket.emit('draw', {
        x0: this.lastX,
        y0: this.lastY,
        x1: currentX,
        y1: currentY,
        color: this.color,
        lineWidth: this.lineWidth
      });
    }else if (this.tool === Tool.Eraser) {
      this.erase(currentX, currentY);
      this.socket.emit('erase', {
        x: currentX,
        y: currentY
      });
    }
    this.lastX = currentX;
    this.lastY = currentY;

  }

  onMouseDown(event: MouseEvent) {
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    this.drawing = true;
    this.lastX = event.clientX - rect.left;
    this.lastY = event.clientY - rect.top;
  }

  onMouseUp(event: MouseEvent) {
    if (!this.drawing) {
      return;
    }
    this.drawing = false;
  }

  onDoubleClick(event: MouseEvent) {
    if (!this.textEditing) {
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      this.textX = event.clientX - rect.left + window.scrollX;
      this.textY = event.clientY - rect.top + window.scrollY;
      this.textInput.style.position = 'absolute';
      this.textInput.style.left = event.clientX + window.scrollX + 'px';
      this.textInput.style.top = event.clientY + window.scrollY + 'px';
      this.textInput.style.fontSize = this.textSize + 'px'
      this.textInput.style.border = 'none';
      this.textInput.style.padding = '0';
      this.textInput.style.margin = '0';
      this.textInput.style.background = 'none';
      this.textInput.style.color = this.color;
      this.textInput.style.fontFamily = 'Arial';
      this.textInput.style.fontWeight = 'bold';
      this.textInput.style.transformOrigin = '0 0';
      this.textInput.style.transform = 'scale(' + (1 / this.context.getTransform().a) + ')';
      this.textInput.style.zIndex = '10';
      this.textInput.value = '';
      this.text = '';

      document.body.appendChild(this.textInput);
      this.textInput.focus();
      this.textEditing = true;
      this.textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          this.text = this.textInput.value;
          document.body.removeChild(this.textInput);
          this.textEditing = false;
          this.writeText(this.text, this.textX, this.textY);
          this.socket.emit('text', { text: this.text, x: this.textX, y: this.textY });
        }
      });
    }
  }

  writeText(text: string, x: number, y: number) {
    this.context.font = `${this.textSize}px Arial`;
    this.context.fillStyle = this.color;
    this.context.fillText(text, x, y);
    this.socket.emit('text', {
      text: text,
      x: x,
      y: y,
      color: this.color,
      fontSize: this.textSize
    });
  }

  onMouseMoveText(event: MouseEvent) {
    if (this.textEditing) {
      const rect = this.canvas.nativeElement.getBoundingClientRect();
      this.textInput.style.left = event.clientX + window.scrollX + 'px'; // Adjust for scroll
      this.textInput.style.top = event.clientY + window.scrollY + 'px'; // Adjust for scroll
      this.textX = event.clientX - rect.left + window.scrollX; // Adjust for scroll
      this.textY = event.clientY - rect.top + window.scrollY; // Adjust for scroll
    }
  }

  onMouseDownText(event: MouseEvent) {
    if (this.textEditing && event.target !== this.textInput) {
      this.finishTextEditing();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.textEditing) {
      if (event.key === 'Enter') {
        this.finishTextEditing();
        this.socket.emit('text', {
          text: this.text,
          x: this.textX,
          y: this.textY,
          color: this.color,
          fontSize: this.textSize
        });
      } else {
        this.text = this.textInput.value;
      }
      if (event.key === 'Escape') {
        this.cancelTextEditing();
      }
    }
  }

  private finishTextEditing() {
    this.text = this.textInput.value;
    document.body.removeChild(this.textInput);
    this.context.font = `${this.textSize}px Arial`;
    this.context.fillStyle = this.color;
    this.context.fillText(this.text, this.textX, this.textY);
    this.textEditing = false;
  }

  cancelTextEditing() {
    this.textInput.remove();
    this.textEditing = false;
    this.text = '';
  }


  setTool(tool: Tool) {
    this.tool = tool;
  }

  setColor(color: string) {
    this.color = color;
  }

  setLineWidth(lineWidth: number) {
    this.lineWidth = lineWidth;
  }

  setTextSize(textSize: number) {
    this.textSize = textSize;
  }

  clearChat() {
    this.showConfirmationDialog('chat');
  }

  clearChatMessages() {
    this.messages = [];
  }

  clear() {
    this.showConfirmationDialog('canvas');
  }

  clearCanvas() {
    this.context.clearRect(
      0,
      0,
      this.canvas.nativeElement.width,
      this.canvas.nativeElement.height
    );
  }

  showConfirmationDialog(confirmType: 'chat' | 'canvas') {
    this.showConfirmation = true;
    this.confirmType = confirmType;
  }

  confirmClearCanvas() {
    this.showConfirmation = false;
    this.clearCanvas();
    this.socket.emit('clear');
  }

  confirmClearChat() {
    this.showConfirmation = false;
    this.clearChatMessages();
    this.socket.emit('clear-chat');
  }

  cancelClear() {
    this.showConfirmation = false;
  }
}
