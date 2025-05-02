import { useState } from "react";
import { sendMessage, socket } from "../api/socket";

export default function Game() {
  const [characterName, setCharacterName] = useState("");
  const [log, setLog] = useState([]);

  // basic echo listener
  socket.onmessage = (e) => setLog((prev) => [...prev, e.data]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-4">Game lobby (WIP)</h1>

      <div className="mb-6">
        <label className="block mb-2">Character name</label>
        <input
          className="border rounded px-3 py-2 w-64"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="e.g. QuizKnight"
        />
        <button
          className="ml-4 px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => sendMessage(`CREATE:${characterName}`)}
        >
          Create
        </button>
      </div>

      <h2 className="text-xl font-medium mb-2">Server messages</h2>
      <ul className="list-disc pl-5">
        {log.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}
