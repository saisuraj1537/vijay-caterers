import React from 'react';

function NotAuthorized() {
  return (
    <div className="text-center mt-5 text-danger">
      <h2>🚫 Not Authorized</h2>
      <p>You do not have permission to access this page.</p>
    </div>
  );
}

export default NotAuthorized;
