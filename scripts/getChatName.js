async function getChatName(client, id) {
  const chat = await client.getChatById(id);
  return chat.name;
}

module.exports = getChatName;
