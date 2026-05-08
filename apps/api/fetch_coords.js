const villages = [
  "Sambirejo, Selupu Rejang, Rejang Lebong",
  "Air Duku, Selupu Rejang, Rejang Lebong",
  "Air Meles Atas, Selupu Rejang, Rejang Lebong",
  "Karang Jaya, Selupu Rejang, Rejang Lebong",
  "Cawang Baru, Selupu Rejang, Rejang Lebong",
  "Cawang Lama, Selupu Rejang, Rejang Lebong",
  "Kali Padang, Selupu Rejang, Rejang Lebong",
  "Kampung Baru, Selupu Rejang, Rejang Lebong",
  "Kayu Manis, Selupu Rejang, Rejang Lebong",
  "Air Putih Kali Bandung, Selupu Rejang, Rejang Lebong",
  "Talang Rimbo Baru, Curup Tengah, Rejang Lebong",
  "Talang Rimbo Lama, Curup Tengah, Rejang Lebong",
  "Batu Galing, Curup Tengah, Rejang Lebong",
  "Karya Baru, Curup Tengah, Rejang Lebong",
  "Air Bang, Curup Tengah, Rejang Lebong",
  "Sukaraja, Curup Timur, Rejang Lebong",
  "Karang Anyar, Curup Timur, Rejang Lebong",
  "Air Meles Bawah, Curup Timur, Rejang Lebong",
  "Talang Ulu, Curup Timur, Rejang Lebong",
  "Pasar Baru, Curup, Rejang Lebong",
  "Timbul Rejo, Curup, Rejang Lebong",
  "Dwi Tunggal, Curup, Rejang Lebong"
];

async function run() {
  const results = {};
  for (const v of villages) {
    const query = encodeURIComponent(v);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: { 'User-Agent': 'Antigravity AI Assistant' }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        results[v.split(',')[0]] = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      } else {
        // Fallback without subdistrict
        const fallbackQuery = encodeURIComponent(v.split(',')[0] + ', Rejang Lebong');
        const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${fallbackQuery}&format=json&limit=1`, {
          headers: { 'User-Agent': 'Antigravity AI Assistant' }
        });
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.length > 0) {
          results[v.split(',')[0]] = { lat: parseFloat(fallbackData[0].lat), lon: parseFloat(fallbackData[0].lon) };
        } else {
          results[v.split(',')[0]] = null;
        }
      }
    } catch (e) {
      console.error(e);
      results[v.split(',')[0]] = null;
    }
    // Sleep to respect rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
