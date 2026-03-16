import React from 'react';

const events = [
    { day: "15", month: "MAY", title: "Full Moon Safari Night", desc: "Experience the wilderness under the mystical glow of the Poya full moon.", tag: "Adventure" },
    { day: "02", month: "JUN", title: "Leopard Tech Summit", desc: "A seminar on integrating AI collars for real-time tracking accuracy.", tag: "Innovation" },
    { day: "10", month: "JUN", title: "Photography Masterclass", desc: "Learn to capture the golden hour with award-winning wildlife photographers.", tag: "Workshop" },
    { day: "01", month: "JUL", title: "Block 2 Reopening", desc: "Celebrating the restoration of the northern tracks with a guided convoy.", tag: "Community" }
];

export default function EventsGrid() {
    return (
        <section className="events-section">
            <h2>Upcoming Events</h2>
            <div className="events-grid">
                {events.map((e, i) => (
                    <div key={i} className="event-card">
                        <div className="event-date">
                            <span className="event-day">{e.day}</span>
                            <span className="event-month">{e.month}</span>
                        </div>
                        <div className="event-info">
                            <h3>{e.title}</h3>
                            <p>{e.desc}</p>
                            <span className="event-tag">{e.tag}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
