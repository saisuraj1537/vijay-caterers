import React, { useEffect, useState } from 'react';
import { database } from '../firebase';
import { ref, onValue, push } from 'firebase/database';

function HomePage() {
  const [servedCount, setServedCount] = useState(0);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [message, setMessage] = useState('');

  // Fetch served count from Firebase
  useEffect(() => {
    const servedRef = ref(database, 'stats/servedCount');
    onValue(servedRef, (snapshot) => {
      if (snapshot.exists()) {
        setServedCount(snapshot.val());
      }
    });
  }, []);

  // Handle form submit to Firebase
  const handleSubmit = async (e) => {
    e.preventDefault();
    const contactsRef = ref(database, 'contacts');
    try {
      await push(contactsRef, form);
      setMessage('Thank you! We will contact you shortly.');
      setForm({ name: '', email: '', phone: '' });
    } catch (err) {
      setMessage('Error submitting form. Try again.');
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-primary text-white text-center py-5">
        <div className="container">
          <h1 className="display-4 fw-bold">Vijay Caterers</h1>
          <p className="lead">Bringing taste and tradition to your events.</p>
          <a
      href="https://drive.google.com/file/d/1DhTvCmE9cY4XJRzZxur6uTNk6MKaDx4r/view?usp=sharing"  // Replace with your actual File ID
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-light mt-3"
    >
      View Our Menu
    </a>
        </div>
      </section>

      {/* Served Counter */}
      <section className="text-center py-4 bg-light">
        <h2 className="display-6">
          Served over <span className="text-success">{servedCount.toLocaleString()}+</span> happy customers!
        </h2>
      </section>

      {/* Event Highlights */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">Event Highlights</h2>
          <div className="row g-4">
            {[
              {
                url: 'https://content.jdmagicbox.com/v2/comp/hyderabad/k7/040pxx40.xx40.151125155456.p7k7/catalogue/manisha-catering-hyderabad-azcef9oeev.jpg',
                title: 'Hyderabad Event',
                desc: 'Grand wedding celebration in Novotel',
              },
              {
                url: 'https://soulchef.in/Content/images/corporate-events/Cross%20Linking%20%28Side%20Images%29/Corporate%20Lunch%20Catering.webp',
                title: 'Corporate Catering',
                desc: 'Flawless service at a corporate gathering',
              },
              {
                url: 'https://media.istockphoto.com/id/498472863/photo/final-touch-for-tasty-canapes.jpg?s=612x612&w=0&k=20&c=tsZMzSOGZEZhOAsooi_tSX0oJ4vhbH3vMwXYlu28wd0=',
                title: 'Festive Feast',
                desc: 'Delicious dishes at a festival event',
              },
            ].map((event, idx) => (
              <div className="col-md-4" key={idx}>
                <div className="card shadow-sm">
                  <img src={event.url} className="card-img-top event-card-img" alt={`Event ${idx + 1}`} />
                  <div className="card-body">
                    <h5 className="card-title">{event.title}</h5>
                    <p className="card-text">{event.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube Shorts */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-5">Latest Shots</h2>
          <div className="row g-4">
            {[
              { id: 'pPsWuwWo2-s', desc: 'Live food serving from our latest event' },
              { id: 'GAeHoDoa6y8', desc: 'Crowd enjoying our dosa station' },
              { id: '36cWEDcVazM', desc: 'Delicious food with excellent service' },
            ].map((shot, index) => (
              <div className="col-md-4" key={index}>
                <div className="card shadow-sm">
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={`https://www.youtube.com/embed/${shot.id}`}
                      title={`Short ${index + 1}`}
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="card-body">
                    <p className="card-text text-muted">{shot.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">Contact Us</h2>
          <form className="mx-auto" style={{ maxWidth: '600px' }} onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                required
                className="form-control"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                className="form-control"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                required
                className="form-control"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Submit
            </button>
            {message && <p className="mt-3 text-success">{message}</p>}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-4">
        <p className="mb-2">Follow us on:</p>
        <div className="mb-3">
          <a href="https://www.instagram.com" className="text-white me-3" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-instagram fs-4"></i>
          </a>
          <a href="https://www.youtube.com" className="text-white" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-youtube fs-4"></i>
          </a>
        </div>
        <p className="mb-0">&copy; {new Date().getFullYear()} Vijay Caterers. All rights reserved.</p>
      </footer>

      {/* Inline Styles */}
      <style>{`
        .event-card-img {
          width: 100%;
          height: 250px;
          object-fit: cover;
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
        }
      `}</style>
    </div>
  );
}

export default HomePage;
