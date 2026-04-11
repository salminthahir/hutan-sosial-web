const {
    SocialForestPermits,
    GroupDemographics,
    BusinessReadiness,
    Institutions
} = require('@/lib/db/models');

exports.getSocialData = async (req, res) => {
    try {
        const { permitId } = req.params;

        // Need institutionId from permit
        const permit = await SocialForestPermits.findByPk(permitId);
        if (!permit) return res.status(404).json({ error: 'Permit not found' });

        const institutionId = permit.institutionId;

        const demographics = await GroupDemographics.findOne({ where: { institutionId } });
        const readiness = await BusinessReadiness.findOne({ where: { institutionId } });
        const institution = await Institutions.findByPk(institutionId);

        res.json({
            institution,
            demographics,
            readiness
        });
    } catch (error) {
        console.error('Error fetching social data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
