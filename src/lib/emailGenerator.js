export function generateEmails(cartItems) {
  const emailsByGarage = {};

  cartItems.forEach(item => {
    const { business, name, quantity } = item;
    if (!business) return;

    if (!emailsByGarage[business.id]) {
      emailsByGarage[business.id] = {
        garageId: business.id,
        garageName: business.name,
        garageEmail: business.email,
        parts: [],
        emailBody: "",
      };
    }

    emailsByGarage[business.id].parts.push({ name, quantity });
  });

  Object.values(emailsByGarage).forEach(garage => {
    const partsList = garage.parts.map(p => `- ${p.name} x${p.quantity}`).join("\n");
    garage.emailBody = `Hi ${garage.garageName},\n\nWe’d like to order the following parts:\n${partsList}\n\nThank you!`;
  });

  return Object.values(emailsByGarage);
}
