const axios = require('axios');
async function test() {
  try {
    const loginRes = await axios.post('http://localhost:4000/api/v1/auth/login', {
      phone: '082222222222',
      password: 'admin123'
    });
    const token = loginRes.data.accessToken;

    const recoRes = await axios.get('http://localhost:4000/api/v1/ai/recommendations/pending', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Recommendations for Air Duku:', recoRes.data.map(r => `${r.sourceVillage.name} -> ${r.targetVillage.name}`));

    const invRes = await axios.get('http://localhost:4000/api/v1/inventory', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Inventory:', invRes.data.data.map(i => `${i.village.name} - ${i.commodity.name} - ${i.currentStock}`));
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
