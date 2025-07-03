// AppContent.js
import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import HomePage from './pages/HomePage';
import BookingsPage from './pages/BookingsPage';
import AdminPanel from './components/AdminPanel';
import BookingDetailsForm from './components/BookingDetailsForm';
import LoginForm from './components/LoginForm';
import CustomerForm from './components/CustomerForm';
import SelectItemsPage from './pages/SelectItemsPage';
import OrdersPage from './components/OrdersPage';
import FinalSelectItemsPage from './pages/FinelSelectItemPage';
import AddUser from './components/AddUser';
import NotAuthorized from './components/NotAuthorized';

function AppContent() {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('loggedIn') === 'true');
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [customerData, setCustomerData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('loggedInMobile');
    localStorage.removeItem('role');
    setLoggedIn(false);
    setRole(null);
    navigate('/'); // Redirect to home after logout
  };

  return (
    <>
      <Navbar
        bg="primary"
        variant="dark"
        expand="md"
        sticky="top"
        expanded={expanded}
        onToggle={() => setExpanded(!expanded)}
      >
        <Container>
          <Navbar.Brand as={Link} to="/">🍽️ Catering Booking</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>Home</Nav.Link>
              {loggedIn && (
                <>
                  {role === 'admin' && (
                    <>
                      <Nav.Link as={Link} to="/orders" onClick={() => setExpanded(false)}>Orders</Nav.Link>
                      <Nav.Link as={Link} to="/admin" onClick={() => setExpanded(false)}>Admin Panel</Nav.Link>
                      <Nav.Link as={Link} to="/add-user" onClick={() => setExpanded(false)}>Add User</Nav.Link>
                    </>
                  )}
                  <Nav.Link as={Link} to="/bookings" onClick={() => setExpanded(false)}>My Bookings</Nav.Link>
                  <Nav.Link as={Link} to="/customer-details" onClick={() => setExpanded(false)}>New Booking</Nav.Link>
                </>
              )}
            </Nav>

            {loggedIn ? (
              <Button
                variant="danger"
                onClick={() => {
                  handleLogout();
                  setExpanded(false);
                }}
              >
                Logout
              </Button>
            ) : (
              <Button
                variant="light"
                onClick={() => {
                  setExpanded(false);
                  navigate('/login');
                }}
              >
                Login
              </Button>
            )}
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginForm setLoggedIn={setLoggedIn} setRole={setRole} />} />
          <Route path="/not-authorized" element={<NotAuthorized />} />

          {/* Protected Routes */}
          {loggedIn && (
            <>
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/customer-details" element={<CustomerForm setCustomerData={setCustomerData} />} />
              <Route path="/booking-details" element={<BookingDetailsForm />} />
              <Route path="/select-items" element={<SelectItemsPage customerData={customerData} />} />
              <Route path="/final-select-items" element={<FinalSelectItemsPage customerData={customerData} />} />
            </>
          )}

          {/* Admin-only Routes */}
          {loggedIn && role === 'admin' ? (
            <>
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/add-user" element={<AddUser />} />
            </>
          ) : (
            <>
              <Route path="/orders" element={<Navigate to="/" />} />
              <Route path="/admin" element={<Navigate to="/" />} />
              <Route path="/add-user" element={<Navigate to="/" />} />
            </>
          )}

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={loggedIn ? "/" : "/login"} />} />
        </Routes>
      </main>
    </>
  );
}

export default AppContent;
