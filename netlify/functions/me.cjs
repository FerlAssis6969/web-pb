const { getUser } = require('./utils/auth.cjs');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const user = getUser(event);
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ user: { id: user.id, username: user.username, role: user.role } })
    };
};
