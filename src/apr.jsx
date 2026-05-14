import React from "react";

const ToDo = ({ todo, toggleTask, removeTask }) => {
  return (
    <div className="item-todo">
      <div
        onClick={() => toggleTask(todo.id)}
        className={todo.completed ? "item-text done" : "item-text"}
      >
        {todo.text}
      </div>
      <div className="item-delete" onClick={() => removeTask(todo.id)}>
        ✕
      </div>
    </div>
  );
};

export default ToDo;