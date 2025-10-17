// src/utils/fetchAuth.js

export async function fetchWithAuth(url, opts = {}) {
    const access = localStorage.getItem('admin_access_token');
    const refresh = localStorage.getItem('admin_refresh_token');
  
    let headers = opts.headers || {};
    if (access) {
      headers['Authorization'] = `Bearer ${access}`;
    }
    headers['Content-Type'] = 'application/json';
  
    let response = await fetch(url, {
      ...opts,
      headers,
    });
  
    if (response.status === 401 && refresh) {
      // try using refresh token
      const refreshRes = await fetch("http://127.0.0.1:8000/api/v1/account/token/refresh/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh })
      });
  
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newAccess = refreshData.access;
  
        // update stored token
        localStorage.setItem('admin_access_token', newAccess);
  
        // retry original request
        headers['Authorization'] = `Bearer ${newAccess}`;
        response = await fetch(url, {
          ...opts,
          headers,
        });
        return response;
      } else {
        // refresh failed
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        throw new Error("Session expired. Please log in again.");
      }
    }
  
    return response;
  }
  