export const boosterService = {
  async grantBooster(userId: string, boosterType = 'standard_booster', quantity = 1) {
    const response = await fetch(`/api/users/${userId}/grant-booster`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booster_type: boosterType, quantity })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Grant booster failed: ${response.status} ${text}`);
    }
    return response.json();
  },

  async openBooster(boosterType = 'standard_booster') {
    const response = await fetch('/api/me/open-booster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booster_type: boosterType })
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Open booster failed: ${response.status} ${text}`);
    }
    return response.json();
  }
};
