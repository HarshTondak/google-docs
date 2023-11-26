import { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

// Auto Save document in 2 seconds of inactivity
const SAVE_INTERVAL_MS = 2000;

// Personalized toolbar for our Editor
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockquote", "code-block"],
  ["clean"],
];

export default function TextEditor() {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  // Creating connection through socket
  useEffect(() => {
    // const s = io("http://localhost:8000");
    const s = io(`${process.env.REACT_APP_SERVER_URL}`);
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // Creating seperate socket rooms for users using documentIDs
  useEffect(() => {
    if (socket == null || quill == null) return;

    // Runs only one time, so no need of return in the end
    socket.once("load-document", (document) => {
      // Sets the document
      quill.setContents(document);
      // Enable editing
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [socket, quill, documentId]);

  // Saving the document in MongoDB
  useEffect(() => {
    if (socket == null || quill == null) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  // Receiving the changes(using socket.io)
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta) => {
      // Updating the changes
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.off("receive-changes", handler);
    };
  }, [socket, quill]);

  // Tracking any changes made in text editor(using quill)
  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    // Resetting the innerHTML on refresh, so that it doesn't create extra new instances
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);

    const q = new Quill(editor, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
    });

    // Disable Editing
    q.disable();
    // Show this text
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
}
