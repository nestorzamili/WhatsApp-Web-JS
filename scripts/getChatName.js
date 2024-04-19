async function getNamesFromIds(client, ids) {
    const names = [];
    for (const id of ids) {
        const chat = await client.getChatById(id);
        names.push(chat.name);
    }
    return names;
}

module.exports = getNamesFromIds;