import { useState, useEffect, useRef } from "react";
import {
  CheckIcon,
  BoldIcon,
  ItalicIcon,
  SquareFillIcon,
} from "@primer/octicons-react";

import Execute from "models/functions.js";

const EditorNotes = ({ r, colum }) => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [activeColor, setActiveColor] = useState(null);

  const editorRef = useRef(null);
  const savedSelection = useRef(null);

  const colors = [
    { icon: <SquareFillIcon size={24} />, value: "#FF0000" },
    { icon: <SquareFillIcon size={24} />, value: "#0000FF" },
    { icon: <SquareFillIcon size={24} />, value: "#008000" },
  ];

  // Salva a seleção atual para formatação
  const saveSelection = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    savedSelection.current = sel.getRangeAt(0);
  };

  // Restaura a seleção salva
  const restoreSelection = () => {
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (savedSelection.current) sel.addRange(savedSelection.current);
  };

  // Aplica a formatação ao texto
  const applyFormat = (command, value = null) => {
    restoreSelection();
    document.execCommand(command, false, value);
    setCurrentNote(editorRef.current.innerHTML);
  };

  // Monitora a seleção para atualizar os botões da toolbar
  useEffect(() => {
    const handleSelectionChange = () => {
      const activeEl = document.activeElement;
      if (activeEl === editorRef.current) {
        setBoldActive(document.queryCommandState("bold"));
        setItalicActive(document.queryCommandState("italic"));
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  // Busca as notas quando 'r' muda
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await Execute.receiveFromNota(r, colum);
        setNotes(res.map((row) => ({ id: row.id, html: row.texto })));
      } catch (err) {
        console.error("Erro ao carregar notas:", err);
      }
    };
    const intervalId = setInterval(fetchData, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(intervalId);
  }, [r, colum]);

  // Handlers
  const handleInput = () => setCurrentNote(editorRef.current.innerHTML);

  const handleEdit = (note) => {
    setEditingNoteId(note.id);
    setCurrentNote(note.html);
    editorRef.current.innerHTML = note.html;
    setBoldActive(document.queryCommandState("bold"));
    setItalicActive(document.queryCommandState("italic"));
    setActiveColor(null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setCurrentNote("");
    editorRef.current.innerHTML = "";
    setBoldActive(false);
    setItalicActive(false);
    setActiveColor(null);
  };

  const handleSubmit = async () => {
    if (!currentNote.trim()) return;
    try {
      if (editingNoteId) {
        // Lógica para atualizar uma nota existente (PUT)
        const response = await fetch("/api/v1/tables/nota", {
          // Substitua pela sua rota de API para atualizar notas
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: editingNoteId, texto: currentNote }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.message || `Erro ao atualizar nota: ${response.status}`,
          );
        }

        const result = await response.json();
        const updated = Array.isArray(result.rows) ? result.rows[0] : result;
        setNotes((prev) =>
          prev.map((note) =>
            note.id === editingNoteId
              ? { id: note.id, html: updated.texto }
              : note,
          ),
        );
        setEditingNoteId(null); // Sai do modo de edição
      } else {
        const noteOBJ = { texto: currentNote, r, colum };

        const newNote = await Execute.sendToNota(noteOBJ);
        const noteObj = Array.isArray(newNote.rows)
          ? {
              id: newNote.rows[0].id,
              html: newNote.rows[0].texto,
            }
          : { id: newNote.id, html: newNote.texto };
        setNotes((prev) => [...prev, noteObj]);
      }
      editorRef.current.innerHTML = "";
      setCurrentNote("");
      setBoldActive(false);
      setItalicActive(false);
      setActiveColor(null);
    } catch (error) {
      console.error("Erro ao salvar/editar nota:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await Execute.removeNota(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
    }
  };

  return (
    <>
      {/* Toolbar de Criação */}
      <div className="flex items-center gap-4 mb-2">
        <div
          onMouseDown={() => saveSelection()}
          onClick={() => applyFormat("bold")}
          className={`indicator cursor-pointer ${boldActive ? "text-base-content" : "text-base-content/50"}`}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={boldActive}
            readOnly
          />
          <span className="font-bold">
            <BoldIcon size={16} />
          </span>
          {boldActive && (
            <span className="indicator-item indicator-top-right">
              <CheckIcon size={12} />
            </span>
          )}
        </div>
        <div
          onMouseDown={() => saveSelection()}
          onClick={() => applyFormat("italic")}
          className={`indicator cursor-pointer ${italicActive ? "text-base-content" : "text-base-content/50"}`}
        >
          <input
            type="checkbox"
            className="hidden"
            checked={italicActive}
            readOnly
          />
          <span className="italic">
            <ItalicIcon size={16} />
          </span>
          {italicActive && (
            <span className="indicator-item indicator-top-right">
              <CheckIcon size={12} />
            </span>
          )}
        </div>
        {colors.map((c) => (
          <div
            key={c.value}
            onMouseDown={() => saveSelection()}
            onClick={() => {
              const isActive = activeColor === c.value;
              applyFormat("foreColor", isActive ? "#000000" : c.value);
              setActiveColor(isActive ? null : c.value);
            }}
            className={`indicator cursor-pointer ${
              activeColor === c.value
                ? "text-base-content"
                : "text-base-content/50"
            }`}
          >
            <input
              type="checkbox"
              className="hidden"
              checked={activeColor === c.value}
              readOnly
            />
            <span
              style={{ color: c.value }}
              className={activeColor === c.value ? "" : "opacity-50"}
            >
              {c.icon}
            </span>
            {activeColor === c.value && (
              <span className="indicator-item indicator-top-right">
                <CheckIcon size={12} />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Editor de Criação */}
      <div
        ref={editorRef}
        contentEditable
        className="p-2 border border-base-300 rounded-lg h-32 overflow-auto mb-2 whitespace-pre-wrap break-words"
        onInput={handleInput}
        suppressContentEditableWarning
      />
      <button
        className={`btn btn-soft ${editingNoteId ? "btn-primary" : "btn-secondary"} mb-4`}
        onClick={handleSubmit}
      >
        {editingNoteId ? "Atualizar Nota" : "Salvar Nota"}
      </button>
      {editingNoteId && (
        <button
          className="btn btn-soft btn-error ml-2 mb-4"
          onClick={handleCancelEdit}
        >
          Cancelar
        </button>
      )}

      {/* Lista de Notas */}
      <ul className="space-y-4">
        {notes.length === 0 && (
          <li className="text-center text-base-content/50">
            Nenhuma nota salva.
          </li>
        )}
        {[...notes] // Cria uma cópia para não modificar o array original
          .sort((a, b) => b.id - a.id) // Ordena do maior ID (mais recente) para o menor
          .map((note) => (
            <li
              key={note.id}
              className="p-4 bg-base-200 rounded-lg shadow break-all"
            >
              <div className="flex justify-between items-start">
                <div
                  className="prose max-w-full break-words whitespace-pre-wrap text-pretty"
                  dangerouslySetInnerHTML={{ __html: note.html }}
                />
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  <button
                    className="btn btn-xs btn-soft btn-primary"
                    onClick={() => handleEdit(note)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-xs btn-soft btn-error"
                    onClick={() => handleDelete(note.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </>
  );
};

export default EditorNotes;
