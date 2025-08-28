import { supabaseClient } from './authService'; // Import the initialized client

/**
 * Fetches the user's profile from the database.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object|null>} The user profile data or null if not found.
 */
export const fetchUserProfile = async (userId) => {
    const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here
        console.error('Error fetching profile:', error);
        throw error;
    }
    return data;
};

/**
 * Updates a user's profile data.
 * @param {string} userId - The ID of the user to update.
 * @param {object} profileData - The new profile data.
 * @returns {Promise<object>} The updated profile data.
 */
export const updateUserProfile = async (userId, profileData) => {
    const { data, error } = await supabaseClient
        .from('user_profiles')
        .upsert({ id: userId, ...profileData }, { onConflict: 'id' })
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
    return data;
};


/**
 * Fetches all companies for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} A list of companies.
 */
export const fetchCompanies = async (userId) => {
    const { data, error } = await supabaseClient
        .from('companies')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching companies:', error);
        throw error;
    }
    return data;
};

/**
 * Fetches all data related to a specific company.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} An object containing shareholders, share classes, and issuances.
 */
export const fetchCompanyRelatedData = async (companyId) => {
    const [shareholdersRes, shareClassesRes, shareIssuancesRes] = await Promise.all([
        supabaseClient.from('shareholders').select('*').eq('company_id', companyId),
        supabaseClient.from('share_classes').select('*').eq('company_id', companyId),
        supabaseClient.from('share_issuances').select('*').eq('company_id', companyId)
    ]);

    if (shareholdersRes.error || shareClassesRes.error || shareIssuancesRes.error) {
        console.error('Error fetching company data:', shareholdersRes.error || shareClassesRes.error || shareIssuancesRes.error);
        throw new Error('Failed to fetch company data.');
    }

    // Enrich issuances with names for easier display
    const enrichedIssuances = shareIssuancesRes.data.map(issuance => {
        const shareholder = shareholdersRes.data.find(s => s.id === issuance.shareholder_id);
        const shareClass = shareClassesRes.data.find(sc => sc.id === issuance.share_class_id);
        return {
          ...issuance,
          shareholder_name: shareholder?.name || 'Unknown',
          share_class_name: shareClass?.name || 'Unknown',
          total_value: issuance.shares * issuance.price_per_share,
        };
      });

    return {
        shareholders: shareholdersRes.data,
        shareClasses: shareClassesRes.data,
        shareIssuances: enrichedIssuances,
    };
};

/**
 * Creates a new company in the database.
 * @param {object} companyData - The data for the new company.
 * @param {string} userId - The ID of the user creating the company.
 * @returns {Promise<object>} The newly created company data.
 */
export const createCompany = async (companyData, userId) => {
    const { data, error } = await supabaseClient
        .from('companies')
        .insert({ ...companyData, user_id: userId })
        .select()
        .single();

    if (error) {
        console.error('Error creating company:', error);
        throw error;
    }
    return data;
};

/**
 * Updates an existing company.
 * @param {string} companyId - The ID of the company to update.
 * @param {object} companyData - The new data for the company.
 * @returns {Promise<object>} The updated company data.
 */
export const updateCompany = async (companyId, companyData) => {
    const { data, error } = await supabaseClient
        .from('companies')
        .update(companyData)
        .eq('id', companyId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Deletes a company.
 * @param {string} companyId - The ID of the company to delete.
 */
export const deleteCompany = async (companyId) => {
    const { error } = await supabaseClient
        .from('companies')
        .delete()
        .eq('id', companyId);
    if (error) throw error;
};


/**
 * Creates a new shareholder.
 * @param {object} shareholderData - The data for the new shareholder.
 * @param {string} companyId - The ID of the company this shareholder belongs to.
 * @returns {Promise<object>} The new shareholder data.
 */
export const createShareholder = async (shareholderData, companyId) => {
    const { data, error } = await supabaseClient
        .from('shareholders')
        .insert({ ...shareholderData, company_id: companyId })
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Updates an existing shareholder.
 * @param {string} shareholderId - The ID of the shareholder to update.
 * @param {object} shareholderData - The new data for the shareholder.
 * @returns {Promise<object>} The updated shareholder data.
 */
export const updateShareholder = async (shareholderId, shareholderData) => {
    const { data, error } = await supabaseClient
        .from('shareholders')
        .update(shareholderData)
        .eq('id', shareholderId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Deletes a shareholder.
 * @param {string} shareholderId - The ID of the shareholder to delete.
 */
export const deleteShareholder = async (shareholderId) => {
    const { error } = await supabaseClient
        .from('shareholders')
        .delete()
        .eq('id', shareholderId);
    if (error) throw error;
};

/**
 * Creates a new share class.
 * @param {object} shareClassData - The data for the new share class.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The new share class data.
 */
export const createShareClass = async (shareClassData, companyId) => {
    const { data, error } = await supabaseClient
        .from('share_classes')
        .insert({ ...shareClassData, company_id: companyId })
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Creates a new share issuance.
 * @param {object} issuanceData - The data for the new issuance.
 * @param {string} companyId - The ID of the company.
 * @returns {Promise<object>} The new issuance data.
 */
export const createIssuance = async (issuanceData, companyId) => {
    const { data, error } = await supabaseClient
        .from('share_issuances')
        .insert({ ...issuanceData, company_id: companyId })
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Deletes a share issuance.
 * @param {string} issuanceId - The ID of the issuance to delete.
 */
export const deleteIssuance = async (issuanceId) => {
    const { error } = await supabaseClient
        .from('share_issuances')
        .delete()
        .eq('id', issuanceId);
    if (error) throw error;
};

// Add this function for Capital Raising Notes product module

/**
 * Creates a new capital raising note.
 * @param {string} offeringType - The type of offering (e.g., 'common', 'safe').
 * @param {object} financials - The financial details for the note.
 * @param {string} companyId - The ID of the associated company.
 * @param {string} userId - The ID of the user creating the note.
 * @returns {Promise<object>} The newly created note data.
 */
export const createCapitalRaiseNote = async (offeringType, financials, companyId, userId) => {
    const { data, error } = await supabaseClient
        .from('capital_raising_notes')
        .insert({
            company_id: companyId,
            user_id: userId,
            offering_type: offeringType,
            details: financials, // The financials object is stored in the JSONB column
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating capital raise note:', error);
        throw error;
    }
    return data;
};
