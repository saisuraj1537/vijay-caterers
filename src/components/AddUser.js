// components/AddUser.js

import React, { useState, useEffect } from 'react';
import { getDatabase, ref, set, onValue, remove } from 'firebase/database';

function AddUser() {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);

  const db = getDatabase();

  // Fetch all users
  useEffect(() => {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const userList = data
        ? Object.entries(data).map(([key, value]) => ({
            name: value.name || '',
            mobileNumber: key,
            password: value.password || '',
          }))
        : [];
      setUsers(userList);
    });
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage('❗ Please enter a valid name.');
      return;
    }

    if (!/^\d{10}$/.test(mobileNumber)) {
      setMessage('❗ Please enter a valid 10-digit mobile number.');
      return;
    }

    const userRef = ref(db, 'users/' + mobileNumber);

    try {
      await set(userRef, { name, mobileNumber, password });
      setMessage('✅ User added successfully!');
      setName('');
      setMobileNumber('');
      setPassword('');
    } catch (error) {
      setMessage('❌ Failed to add user: ' + error.message);
    }
  };

  const handleDelete = async (number) => {
    const confirmed = window.confirm(`Are you sure you want to delete user ${number}?`);
    if (!confirmed) return;

    try {
      await remove(ref(db, 'users/' + number));
      setMessage(`🗑️ User ${number} deleted successfully!`);
    } catch (error) {
      setMessage('❌ Failed to delete user: ' + error.message);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow rounded-4">
            <div className="card-header bg-primary text-white rounded-top-4">
              <h2 className="h5 mb-0 fw-semibold">
                <i className="bi bi-person-plus-fill me-2"></i>Add New User
              </h2>
            </div>

            <div className="card-body p-4">
              {message && (
                <div
                  className={`alert ${
                    message.includes('✅')
                      ? 'alert-success'
                      : message.includes('❌') || message.includes('❗')
                      ? 'alert-danger'
                      : 'alert-info'
                  }`}
                  role="alert"
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleAdd}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Mobile Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="text"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100 fw-bold">
                  <i className="bi bi-plus-circle me-2"></i>Add User
                </button>
              </form>

              <hr className="my-5" />

              <h5 className="mb-3 text-dark fw-bold">
                <i className="bi bi-people-fill me-2"></i>Existing Users
              </h5>

              {users.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-person-x fs-1"></i>
                  <p className="mt-2">No users found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover table-bordered align-middle text-center shadow-sm rounded-4 overflow-hidden">
                    <thead className="table-primary">
                      <tr>
                        <th className="fw-semibold">Name</th>
                        <th className="fw-semibold">Mobile</th>
                        <th className="fw-semibold">Password</th>
                        <th className="fw-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.mobileNumber}>
                          <td className="text-capitalize">{user.name}</td>
                          <td>{user.mobileNumber}</td>
                          <td>
                            <code>{user.password}</code>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(user.mobileNumber)}
                              title="Delete user"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddUser;
