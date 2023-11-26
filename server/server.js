const mongoose = require("mongoose");
const Document = require("./Document");
const { dotenv } = require("dotenv").config();

console.log(process.env.DATABASE);
console.log(process.env.PORT);
console.log(process.env.CLIENT_URL);

mongoose.connect(`${process.env.DATABASE}`, {});
const PORT = process.env.PORT || 8000;

const io = require("socket.io")(PORT, {
  cors: {
    origin: `${process.env.CLIENT_URL}`,
    methods: ["GET", "POST"],
  },
});

const defaultValue = "";

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
}
