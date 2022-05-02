import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from './supabase-client';

export const UserContext = createContext();

export const UserContextProvider = (props) => {
  const [userLoaded, setUserLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userFinderLoaded, setUserFinderLoaded] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);

  useEffect(() => {
    const session = supabase.auth.session();
    setSession(session);
    setUser(session?.user ?? null);
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    setUserFinderLoaded(true);

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const getUserDetails = () => supabase.from('users').select('*').single();
  const getSubscription = () =>
    supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .single();

  useEffect(() => {
    if (user) {
      Promise.allSettled([getUserDetails(), getSubscription()]).then(
        (results) => {
          setUserDetails(results[0].value.data);
          setSubscription(results[1].value.data);

          if(results[1].value.data){
            setPlanDetails(results[1].value.data.prices.products.name);
          } else {
            setPlanDetails('free');
          }

          setUserLoaded(true);
          setUserFinderLoaded(true);
        }
      );
    }
  }, [user]);

  const value = {
    session,
    user,
    userDetails,
    userLoaded,
    subscription,
    userFinderLoaded,
    planDetails,
    signIn: (options) => supabase.auth.signIn(options, {redirectTo: 'https://reflio.com/dashboard'}),
    signUp: (options) => supabase.auth.signUp(options, {redirectTo: 'https://reflio.com/dashboard'}),
    forgotPassword: (email) => supabase.auth.api.resetPasswordForEmail(email),
    signOut: () => {
      setUserDetails(null);
      setSubscription(null);
      return supabase.auth.signOut();
    }
  };
  return <UserContext.Provider value={value} {...props} />;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error(`useUser must be used within a UserContextProvider.`);
  }
  return context;
};

//Reset Password
export const resetPassword = async (token, password) => {
  const { error, data } = await supabase.auth.api
    .updateUser(token, { password : password })

  if(error){
    return error;
  } else {
    return data
  }
};

//Get user account
export const getCompanies = async (userId) => {
  const { data, error } = await supabase
  .from('companies')
  .select('*')
  .eq('id', userId)

  if(error) return error; 
  return data;
};

//Get user campaigns
export const getCampaigns = async (companyId) => {
  const { data, error } = await supabase
  .from('campaigns')
  .select('*')
  .eq('company_id', companyId)

  if(error) return error; 
  return data;
};

//Get user campaigns
export const getAffiliates = async (companyId) => {
  const { data, error } = await supabase
  .from('affiliates')
  .select('*')
  .eq('company_id', companyId)

  if(error) return error; 
  return data;
};

export const newCompany = async (user, form) => {
  const { data, error } = await supabase.from('companies').insert({
    id: user?.id,
    company_name: form?.company_name,
    company_url: form?.company_url,
    domain_verified: false
  });

  if (error) {
    throw error;
  } else {
    return data;
  }
};

export const newCampaign = async (user, form, companyId) => {
  const { data, error } = await supabase.from('campaigns').insert({
    id: user?.id,
    campaign_name: form?.campaign_name,
    commission_type: form?.commission_type,
    commission_value: form?.commission_value,
    company_id: companyId
  });

  if (error) {
    throw error;
  } else {
    return "success";
  }
};

export const editCampaign = async (companyId, form) => {
  const { error } = await supabase
    .from('campaigns')
    .update({
      campaign_name: form?.commission_name,
      commission_type: form?.commission_type,
      commission_value: form?.commission_value,
    })
    .eq('company_id', companyId);
  if (error) return "error";

  return "success";
};

//New Stripe Account
export const newStripeAccount = async (userId, stripeId, companyId) => {
  const getAccountDetails = await fetch('/api/get-account-details', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId: stripeId
    })
  }).then(function(response) {
    return response.json();

  }).then(function(data) {
    return data;
  });

  const { error } = await supabase
    .from('companies')
    .update({
      stripe_account_data: getAccountDetails?.data,
      stripe_id: stripeId
    }).eq('company_id', companyId);

  if (error) {
    console.log('first error was here')
    return "error";
  } else {
    return "success";
  }

};

export const deleteCompany = async (id) => {
  const { error } = await supabase
    .from('companies')
    .delete()
    .match({ company_id: id })

    if (error) {
      return "error";
    } else {
      return "success";
    }
};

export const editCurrency = async (companyId, data) => {
  if(!data?.company_currency){
    return "error";
  }

  const { error } = await supabase
    .from('companies')
    .update({
      company_currency: data?.company_currency
    })
    .eq('company_id', companyId);
  if (error) return "error";

  return "success";
};

export const getSubmissions = async (userId, companyId, submissionId) => {
  
  if(companyId !== null){
    const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('company_id', companyId)
    .eq('id', userId)
    .order('created', { ascending: false })
  
    if(error) return error; 
    return data;
  }

  if(submissionId !== null){
    const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('submission_id', submissionId)
    .single();
  
    if(error) return error; 
    return data;
  }

  if(submissionId === null && companyId === null){
    const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', userId)
    .order('created', { ascending: false })
  
    if(error) return error; 
    return data;
  }

  return null;
};

export const editCompanyWebsite = async (id, form) => {
  const { error } = await supabase
    .from('companies')
    .update({ 
      company_url: form?.company_url,
      domain_verified: false
    })
    .match({ company_id: id })

    if (error) {
      return "error";
    } else {
      return "success";
    }
};

export const disableEmails = async (id, type) => {
  const { error } = await supabase
    .from('companies')
    .update({ disable_emails: type})
    .match({ company_id: id })

    if (error) {
      return "error";
    } else {
      return "success";
    }
};

export const archiveSubmission = async (id, type) => {
  const { error } = await supabase
    .from('submissions')
    .update({ archived: type})
    .match({ submission_id: id })

    if (error) {
      return "error";
    } else {
      return "success";
    }
};

// //Upload logo to log
// export const uploadLogoImage = async (stripeId, file) => {
//   const modifiedId = stripeId?.replace('_', '-');
//   const { data, error } = await supabase.storage
//   .from('assets')
//   .upload(`${modifiedId}.png`, file, {
//     cacheControl: '0',
//     upsert: true
//   })

//   if (error) return error;

//   if(data?.Key){
//     const { error } = await supabase
//     .from('stripe_accounts')
//     .update({
//       logo_url: data?.Key,
//     }).eq('stripe_id', stripeId);

//     if (error) return error;
//   }
  
//   return data;
// };