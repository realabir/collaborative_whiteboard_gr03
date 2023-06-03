# Collaborative Whiteboard

Link: https://collaborative-whiteboard-gr03.herokuapp.com/

How to start (locally):
1. Install Angular Framework
2. Go to "package.json" and install all the packages (There should be a button on the bottom right with "npm install")
3. Go to component.ts -> comment out the line with ``this.socket = io('https://collaborative-whiteboard-gr03.herokuapp.com/');``, and uncomment the line with ``this.socket = io('http://localhost:3000/');``.
4. ng build
5. npm start
6. Go to -> http://localhost:3000/
7. To test the collaborative feature just open another tab with http://localhost:3000/
