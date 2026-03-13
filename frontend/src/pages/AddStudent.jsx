function AddStudent() {

  return (
    <div>
      <h2>Add Student</h2>  

      <input placeholder="Student Name" />
      <input placeholder="Roll Number" />
      <input placeholder="Register Number" />
      <input placeholder="Department" />

      <select>
        <option>1</option>
        <option>2</option>
        <option>3</option>
        <option>4</option>
      </select>

      <input placeholder="Parent Phone" />
      <input type="file" />

    </div>
  );
}

export default AddStudent;