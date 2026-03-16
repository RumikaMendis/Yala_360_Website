import React from 'react';

const animals = [
    {
        name: "Sri Lankan Leopard",
        status: "🔴 Endangered",
        desc: (
            <>
                The Sri Lankan leopard (<em>Panthera pardus kotiya</em>) is the top predator in Yala. With the highest leopard density in the world, Block I is the best zone for sightings, especially during dawn and dusk hours.
            </>
        ),
        stats: { zone: "Block I", time: "5–7 AM", pop: "~40 in Yala" },
        img: "/images/leopard.png"
    },
    {
        name: "Sri Lankan Elephant",
        status: "🟡 Vulnerable",
        desc: (
            <>
                The Sri Lankan elephant (<em>Elephas maximus maximus</em>) roams in herds across the park's grasslands. Yala hosts over 300 elephants, frequently gathering near waterholes during the dry season.
            </>
        ),
        stats: { zone: "Block II", time: "3–5 PM", pop: "300+ in Yala" },
        img: "/images/elephant.png"
    },
    {
        name: "Sri Lankan Sloth Bear",
        status: "🔴 Endangered",
        desc: (
            <>
                The sloth bear (<em>Melursus ursinus</em>) is a shy, nocturnal species often spotted foraging among rocky terrain. Block III offers the highest probability of sightings during early mornings.
            </>
        ),
        stats: { zone: "Block III", time: "5–7 AM", pop: "~20 in Yala" },
        img: "/images/sloth_bear.png"
    },
    {
        name: "Mugger Crocodile",
        status: "🟢 Least Concern",
        desc: (
            <>
                The mugger crocodile (<em>Crocodylus palustris</em>) can be found basking near waterholes and along the Menik Ganga river. These ancient predators are a frequent sight along Block I's waterways.
            </>
        ),
        stats: { zone: "Block I", time: "All Day", pop: "100+ in Yala" },
        img: "/images/crocodile.png"
    }
];

export default function WildlifeGallery() {
    return (
        <section className="animals-section">
            <h2>Wildlife of Yala</h2>
            <p className="animals-subtitle">Discover the iconic species that call Yala National Park home.</p>
            <div className="animals-grid">
                {animals.map((animal, i) => (
                    <div key={i} className="animal-card">
                        <img src={animal.img} alt={animal.name} />
                        <div className="animal-card-body">
                            <h3>{animal.name}</h3>
                            <span className="animal-status">{animal.status}</span>
                            <p className="animal-desc">{animal.desc}</p>
                            <div className="animal-stats">
                                <div className="stat-col"><span>Best Zone</span><strong>{animal.stats.zone}</strong></div>
                                <div className="stat-col"><span>Peak Time</span><strong>{animal.stats.time}</strong></div>
                                <div className="stat-col"><span>Population</span><strong>{animal.stats.pop}</strong></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
