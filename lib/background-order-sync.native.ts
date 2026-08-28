import { Platform } from "react-native";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

import * as Auth from "@/lib/_core/auth";
import { syncPendingOrderChanges } from "@/lib/pending-order-sync";

export const PENDING_ORDER_SYNC_TASK = "afterroom-pending-order-sync";

if (Platform.OS !== "web" && !TaskManager.isTaskDefined(PENDING_ORDER_SYNC_TASK)) {
  TaskManager.defineTask(PENDING_ORDER_SYNC_TASK, async () => {
    try {
      const user = await Auth.getUserInfo();
      if (user) await syncPendingOrderChanges(user.id);
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

export async function registerPendingOrderSyncTask() {
  if (Platform.OS === "web") return false;
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false;
  const registered = await TaskManager.isTaskRegisteredAsync(PENDING_ORDER_SYNC_TASK);
  if (!registered) {
    await BackgroundTask.registerTaskAsync(PENDING_ORDER_SYNC_TASK, { minimumInterval: 15 });
  }
  return true;
}
