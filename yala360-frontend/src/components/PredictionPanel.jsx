import React, { useState, useEffect } from 'react';

export default function PredictionPanel({ blockTraffic = {} }) {
    const [noiseVals, setNoiseVals] = useState([0, 0, 0]);

    // Update noise slightly every few seconds to keep it purely "live" feeling
    useEffect(() => {
        const interval = setInterval(() => {
            setNoiseVals([
                Math.floor(Math.random() * 5) - 2,
                Math.floor(Math.random() * 5) - 2,
                Math.floor(Math.random() * 5) - 2
            ]);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Animal Prediction System Logic
    const t1 = blockTraffic["Yala National Park - Block 1"] || 0;
    const t2 = blockTraffic["Yala National Park - Block 2"] || 0;
    const t3 = blockTraffic["Yala National Park - Block 3"] || 0;

    // Time of day effect
    const hour = new Date().getHours();

    let timeBonusLeopard = 0;
    let timeBonusElephant = 0;
    let timeBonusBear = 0;

    if (hour >= 5 && hour <= 8) {
        timeBonusLeopard = 10;
        timeBonusElephant = 8;
        timeBonusBear = 15; // Sloth bears are also active early morning
    } else if (hour >= 16 && hour <= 19) {
        timeBonusLeopard = 12;
        timeBonusElephant = 5;
        timeBonusBear = 10;
    }

    // Base probabilities
    let baseLeopard = 70;
    let baseElephant = 75;
    let baseBear = 55;

    // Final probabilities integrating base, time, traffic penalty, and random movement noise
    const probLeopard = Math.max(
        5,
        Math.min(99, baseLeopard + timeBonusLeopard - (t1 * 10) + noiseVals[0])
    );

    const probElephant = Math.max(
        10,
        Math.min(99, baseElephant + timeBonusElephant - (t2 * 4) + noiseVals[1])
    );

    const probBear = Math.max(
        5,
        Math.min(99, baseBear + timeBonusBear - (t3 * 12) + noiseVals[2])
    );

    const predictions = [
        { animal: "Leopard", block: "Block I", prob: probLeopard, icon: "🐆" },
        { animal: "Elephant", block: "Block II", prob: probElephant, icon: "🐘" },
        { animal: "Sloth Bear", block: "Block III", prob: probBear, icon: "🐻" }
    ];

    return (
        <div className="prediction-panel">
            <div className="route-header">
                <i className="ph ph-chart-line-up"></i>
                <span>ANIMAL PREDICTION</span>
            </div>
            <ul className="prediction-list">
                {predictions.map((p, i) => (
                    <li key={i} className="prediction-item">
                        <div className="prediction-item-header">
                            <span>{p.icon} {p.animal} – {p.block}</span>
                            <span className="prob-val">{p.prob}%</span>
                        </div>
                        <div className="prob-bar-container">
                            <div className="prob-bar" style={{ width: `${p.prob}%` }}></div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
