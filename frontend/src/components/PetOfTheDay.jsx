import { useEffect, useState } from "react";

export default function PetOfTheDay() {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPet() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/pets/pet-of-the-day`
        );
        const data = await res.json();
        setPet(data.pet);
      } catch (err) {
        console.error("Failed to load pet of the day", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPet();
  }, []);

  if (loading) return <p>Loading Pet of the Day…</p>;
  if (!pet) return <p>No pet available today.</p>;

  return (
    <div className="pet-of-day">
      <h2>🐾 Pet of the Day</h2>
      <img src={pet.imageUrl} alt={pet.name} />
      <h3>{pet.name}</h3>
      <p>{pet.description}</p>
    </div>
  );
}