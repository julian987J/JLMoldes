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
        <div className="modal-box w-full max-w-[98%]">
          <h3 className="font-bold text-lg mb-4">ANOTAÇÕES</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="overflow-x-auto rounded-box border border-warning  p-4">
              <EditorNotes r={r} colum={1} />
            </div>
            <div className="overflow-x-auto rounded-box border border-primary  p-4">
              <EditorNotes r={r} colum={2} />
            </div>
            <div className="overflow-x-auto rounded-box border border-secondary  p-4">
              <EditorNotes r={r} colum={3} />
            </div>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default Notes;
