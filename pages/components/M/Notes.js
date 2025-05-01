import { NoteIcon } from "@primer/octicons-react";
import EditorNotes from "./EditorNotes";

const Notes = ({ r }) => {
  return (
    <>
      <button
        className="btn btn-xs btn-soft btn-secondary"
        onClick={() => document.getElementById(`my_modal_${r}`).showModal()}
      >
        <NoteIcon size={16} /> NOTAS
      </button>

      <dialog id={`my_modal_${r}`} className="modal">
        <div className="modal-box w-full max-w-5xl">
          <h3 className="font-bold text-lg mb-4">ANOTAÇÕES</h3>
          <EditorNotes r={r} />
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default Notes;
