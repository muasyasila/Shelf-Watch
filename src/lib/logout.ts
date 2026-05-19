export const logout = () => {
  localStorage.removeItem("shelfwatch_token");
  localStorage.removeItem("shelfwatch_user");
  document.cookie = "shelfwatch_token=; path=/; max-age=0";
  window.location.href = "/login";
};