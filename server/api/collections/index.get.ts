import {
  getSidebarCollections,
  requireCurrentUser,
} from "~~/server/utils/sidebar";

export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event);

  return getSidebarCollections(user.id);
});
