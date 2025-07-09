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

      <dialog id={`my_modal_${r}`} className="modal modal-top">
        <div className="modal-box max-w-[98%] mx-auto px-0 mt-4 rounded-t-xl pb-1">
          <h3 className="font-bold text-lg mb-4 px-4">ANOTAÇÕES</h3>
          <div className="grid grid-cols-3 gap-1 px-1">
            <div className="overflow-x-auto rounded-box border border-warning  py-1 px-1">
              <EditorNotes r={r} colum={1} />
            </div>
            <div className="overflow-x-auto rounded-box border border-primary  py-1 px-1">
              <EditorNotes r={r} colum={2} />
            </div>
            <div className="overflow-x-auto rounded-box border border-secondary  py-1 px-1">
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
