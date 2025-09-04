// Network connectivity checker for Firebase and Supabase
export const checkNetworkConnectivity = async () => {
  const results = {
    firebase: false,
    supabase: false,
    google: false,
    general: false
  };

  try {
    // Check general internet connectivity
    const generalResponse = await fetch('https://www.google.com/favicon.ico', { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    results.general = true;
  } catch (error) {
    console.warn('General internet connectivity issue:', error);
  }

  try {
    // Check Firebase connectivity
    const firebaseResponse = await fetch('https://identitytoolkit.googleapis.com/v1/projects', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    results.firebase = true;
  } catch (error) {
    console.warn('Firebase connectivity issue:', error);
  }

  try {
    // Check Supabase connectivity
    const supabaseResponse = await fetch('https://tqctoefqgucboqscjauv.supabase.co/rest/v1/', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    results.supabase = true;
  } catch (error) {
    console.warn('Supabase connectivity issue:', error);
  }

  try {
    // Check Google APIs connectivity
    const googleResponse = await fetch('https://accounts.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    results.google = true;
  } catch (error) {
    console.warn('Google APIs connectivity issue:', error);
  }

  return results;
};

export const diagnoseNetworkIssues = async () => {
  console.log('🔍 Checking network connectivity...');
  
  const connectivity = await checkNetworkConnectivity();
  
  console.log('📊 Network Connectivity Results:');
  console.log('- General Internet:', connectivity.general ? '✅' : '❌');
  console.log('- Firebase APIs:', connectivity.firebase ? '✅' : '❌');
  console.log('- Supabase APIs:', connectivity.supabase ? '✅' : '❌');
  console.log('- Google APIs:', connectivity.google ? '✅' : '❌');

  if (!connectivity.general) {
    console.log('🚨 No internet connection detected');
    return 'NO_INTERNET';
  }

  if (!connectivity.firebase) {
    console.log('🚨 Firebase APIs are not reachable');
    console.log('💡 Try:');
    console.log('  - Check firewall settings');
    console.log('  - Try different DNS (8.8.8.8, 8.8.4.4)');
    console.log('  - Switch to mobile hotspot');
    return 'FIREBASE_BLOCKED';
  }

  if (!connectivity.google) {
    console.log('🚨 Google APIs are not reachable');
    console.log('💡 This may affect Google Sign-in');
    return 'GOOGLE_BLOCKED';
  }

  if (!connectivity.supabase) {
    console.log('🚨 Supabase APIs are not reachable');
    console.log('💡 This will affect image uploads and message storage');
    return 'SUPABASE_BLOCKED';
  }

  console.log('✅ All services are reachable');
  return 'ALL_GOOD';
};

// DNS flush helper
export const suggestNetworkFixes = () => {
  console.log('🔧 Network troubleshooting suggestions:');
  console.log('');
  console.log('1. Flush DNS cache:');
  console.log('   Windows: ipconfig /flushdns');
  console.log('   Mac: sudo dscacheutil -flushcache');
  console.log('   Linux: sudo systemctl restart systemd-resolved');
  console.log('');
  console.log('2. Change DNS servers to Google DNS:');
  console.log('   Primary: 8.8.8.8');
  console.log('   Secondary: 8.8.4.4');
  console.log('');
  console.log('3. Check firewall/antivirus settings');
  console.log('');
  console.log('4. Try a different network (mobile hotspot)');
  console.log('');
  console.log('5. Restart your router/modem');
};