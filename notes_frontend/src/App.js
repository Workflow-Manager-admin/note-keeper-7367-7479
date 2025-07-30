import React, { useState, useEffect, useMemo } from "react";
import "./App.css";

/*
  Colors used:
    - Primary:   #1976d2
    - Secondary: #455a64
    - Accent:    #ffca28
  Layout:
    - Header bar: app name, search, new note
    - Sidebar: tags (static, for minimalistic demo), all notes navigation
    - Main: note viewer/editor
  Note: For production, backend/API connectivity would be required. This demo is in-memory only.
*/

const DEMO_TAGS = ["All Notes", "Work", "Personal", "Ideas"];

function generateId() {
  // Basic unique id generator.
  return "note-" + Math.random().toString(36).substr(2, 9);
}

// PUBLIC_INTERFACE
function App() {
  // Notes state: { id, title, content, tags, created, updated }
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // UI/edit state
  const [editing, setEditing] = useState(false); // true if creating or editing
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("All Notes");
  const [theme] = useState("light"); // Only light mode per request

  // Form for new/edit note
  const [form, setForm] = useState({ title: "", content: "", tags: [] });

  // -- Note selection, filtering, and search logic --

  // PUBLIC_INTERFACE
  function handleSelectNote(id) {
    setSelectedId(id);
    setEditing(false);
    const note = notes.find((n) => n.id === id);
    if (note) setForm({ ...note }); // for potential edit
  }

  // PUBLIC_INTERFACE
  function handleStartNewNote() {
    setForm({ title: "", content: "", tags: [] });
    setEditing(true);
    setSelectedId(null);
  }

  // PUBLIC_INTERFACE
  function handleEditNote(id) {
    const note = notes.find((n) => n.id === id);
    if (note) {
      setEditing(true);
      setForm({ ...note });
      setSelectedId(id);
    }
  }

  // PUBLIC_INTERFACE
  function handleDeleteNote(id) {
    if (
      window.confirm(
        "Are you sure you want to delete this note? This action is permanent."
      )
    ) {
      setNotes((ns) => ns.filter((n) => n.id !== id));
      if (selectedId === id) setSelectedId(null);
      setEditing(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleSaveNote(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Title is required.");
      return;
    }
    if (form.id) {
      // Edit existing note
      setNotes((ns) =>
        ns.map((n) =>
          n.id === form.id
            ? { ...form, updated: new Date().toISOString() }
            : n
        )
      );
      setSelectedId(form.id);
    } else {
      // Create new note
      const id = generateId();
      setNotes((ns) => [
        {
          id,
          title: form.title,
          content: form.content,
          tags: form.tags,
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        },
        ...ns,
      ]);
      setSelectedId(id);
    }
    setEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleCancelEdit() {
    setEditing(false);
    if (selectedId) {
      // revert form to selected note
      const note = notes.find((n) => n.id === selectedId);
      if (note) setForm({ ...note });
    } else {
      setForm({ title: "", content: "", tags: [] });
    }
  }

  // PUBLIC_INTERFACE
  function handleTagFilter(tag) {
    setActiveTag(tag);
    setSelectedId(null);
    setEditing(false);
  }

  // PUBLIC_INTERFACE
  function handleSearchChange(e) {
    setSearch(e.target.value);
    setSelectedId(null);
    setEditing(false);
  }

  // Filter and search notes
  const filteredNotes = useMemo(() => {
    let byTag =
      activeTag === "All Notes"
        ? notes
        : notes.filter((n) => n.tags && n.tags.includes(activeTag));
    if (search.trim()) {
      const low = search.toLowerCase();
      return byTag.filter(
        (n) =>
          n.title.toLowerCase().includes(low) ||
          (n.content && n.content.toLowerCase().includes(low))
      );
    }
    return byTag;
  }, [notes, activeTag, search]);

  // Select most recent note when starting, if exists
  useEffect(() => {
    if (notes.length && selectedId === null && !editing) {
      setSelectedId(notes[0].id);
      setForm({ ...notes[0] });
    }
    // eslint-disable-next-line
  }, [notes.length]);

  // PUBLIC_INTERFACE
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // PUBLIC_INTERFACE
  function handleTagInput(e) {
    setForm((f) => ({
      ...f,
      tags: e.target.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }));
  }

  // Layout structure: header, sidebar, main
  return (
    <div className="notes-root" data-theme={theme}>
      <HeaderBar
        onSearch={handleSearchChange}
        onCreate={handleStartNewNote}
        search={search}
      />
      <div className="notes-layout">
        <Sidebar
          tags={DEMO_TAGS}
          active={activeTag}
          onSelect={handleTagFilter}
        />
        <main className="notes-main">
          {/* Main Area: Editing, Viewing, List fallback */}
          {editing ? (
            <NoteEditor
              form={form}
              onChange={handleFormChange}
              onChangeTags={handleTagInput}
              onSubmit={handleSaveNote}
              onCancel={handleCancelEdit}
            />
          ) : (
            <>
              {!!filteredNotes.length ? (
                <NoteList
                  notes={filteredNotes}
                  selected={selectedId}
                  onSelect={handleSelectNote}
                  onEdit={handleEditNote}
                  onDelete={handleDeleteNote}
                />
              ) : (
                <div className="notes-list-empty">
                  <span>No notes found.</span>
                </div>
              )}

              <NoteViewer
                note={notes.find((n) => n.id === selectedId)}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
              />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// --- HeaderBar Component ---
// PUBLIC_INTERFACE
function HeaderBar({ onSearch, onCreate, search }) {
  return (
    <header className="notes-header-bar">
      <span className="notes-title">📝 Note Keeper</span>
      <input
        className="notes-search"
        placeholder="Search notes"
        value={search}
        onChange={onSearch}
        aria-label="Search notes"
      />
      <button className="notes-new-btn" onClick={onCreate}>
        + New Note
      </button>
    </header>
  );
}

// --- Sidebar Component (tags/navigation) ---
// PUBLIC_INTERFACE
function Sidebar({ tags, active, onSelect }) {
  return (
    <aside className="notes-sidebar">
      <nav>
        <ul>
          {tags.map((tag) => (
            <li key={tag}>
              <button
                className={
                  "notes-sidebar-tag" +
                  (active === tag ? " active" : "")
                }
                onClick={() => onSelect(tag)}
                aria-pressed={active === tag}
              >
                {tag}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// --- Note List (for selection & navigation) ---
// PUBLIC_INTERFACE
function NoteList({ notes, selected, onSelect, onEdit, onDelete }) {
  return (
    <section className="notes-list">
      <ul>
        {notes.map((note) => (
          <li
            key={note.id}
            className={
              "notes-list-item" +
              (selected === note.id ? " selected" : "")
            }
          >
            <button
              className="notes-list-link"
              onClick={() => onSelect(note.id)}
            >
              <span className="note-title">{note.title}</span>
              <span className="note-date">
                {note.updated
                  ? "Updated: " +
                    new Date(note.updated).toLocaleDateString()
                  : ""}
              </span>
            </button>
            <div className="notes-list-actions">
              <button
                className="icon-btn accent"
                aria-label="Edit"
                onClick={() => onEdit(note.id)}
                title="Edit"
              >
                ✏️
              </button>
              <button
                className="icon-btn"
                aria-label="Delete"
                onClick={() => onDelete(note.id)}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Note Viewer (read-only) ---
// PUBLIC_INTERFACE
function NoteViewer({ note, onEdit, onDelete }) {
  if (!note) return null;
  return (
    <section className="note-viewer">
      <div className="viewer-toolbar">
        <button
          className="viewer-edit-btn"
          onClick={() => onEdit(note.id)}
          title="Edit"
        >
          Edit
        </button>
        <button
          className="viewer-delete-btn"
          onClick={() => onDelete(note.id)}
          title="Delete"
        >
          Delete
        </button>
      </div>
      <div>
        <h2>{note.title}</h2>
        <div className="viewer-meta">
          <span>
            {note.created &&
              "Created: " +
                new Date(note.created).toLocaleDateString()}
          </span>
          {note.updated && note.created !== note.updated && (
            <span>
              | Updated: {new Date(note.updated).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="viewer-content">
          <pre>{note.content}</pre>
          {note.tags && note.tags.length > 0 && (
            <div className="viewer-tags">
              {note.tags.map((t) => (
                <span className="note-tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// --- Note Editor (create/edit form) ---
// PUBLIC_INTERFACE
function NoteEditor({ form, onChange, onChangeTags, onSubmit, onCancel }) {
  return (
    <section className="note-editor">
      <form className="note-form" onSubmit={onSubmit} autoComplete="off">
        <input
          autoFocus
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="Title"
          required
          className="note-input"
        />
        <textarea
          name="content"
          value={form.content}
          onChange={onChange}
          placeholder="Write your note here..."
          className="note-textarea"
          rows={8}
        />
        <input
          name="tags"
          value={(form.tags || []).join(", ")}
          onChange={onChangeTags}
          placeholder="Tags (comma separated)"
          className="note-tags-input"
        />
        <div className="form-actions">
          <button type="submit" className="editor-save-btn">
            Save
          </button>
          <button type="button" className="editor-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

export default App;
