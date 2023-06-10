# Collaborative Whiteboard

Link: https://collaborative-whiteboard-gr03.herokuapp.com/

Before you start:
1. Install Node.js, Anuglar and TypeScript

How to start (locally):
1. Go to "package.json" and install all the packages (There should be a button on the bottom right with "npm install")
2. Go to component.ts -> comment out the line with ``this.socket = io('https://collaborative-whiteboard-gr03.herokuapp.com/');``, and uncomment the line with ``this.socket = io('http://localhost:3000/');``.
3. ng build
4. npm start
5. Go to -> http://localhost:3000/
6. To test the collaborative feature just open another tab with http://localhost:3000/
