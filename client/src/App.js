import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useParams,
  useNavigate,
} from "react-router-dom";
import TextEditor from "./TextEditor";
import "./styles.css";
import { v4 as uuidV4 } from "uuid";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="documents/:id" element={<Document />} />
      </Routes>
    </Router>
  );
}

function Home() {
  const navigate = useNavigate();
  useEffect(() => {
    // Redirect to a new document with a generated UUID
    navigate(`/documents/${uuidV4()}`);
  }, [navigate]);

  // No need to render anything for the home route
  return null;
}

function Document() {
  const { id } = useParams();
  return (
    <div>
      <TextEditor documentId={id} />
    </div>
  );
}

export default App;
