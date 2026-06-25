const { createProfile } = require('../services/facebookBot');

exports.generate = async (req, res) => {
    const { firstName, lastName } = req.body;
    try {
        // ហៅទៅ Service ដើម្បីដំណើរការ Automation
        const result = await createProfile(firstName, lastName);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};