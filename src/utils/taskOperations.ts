import { Task, OwnerId, OWNER_TBC } from '../types/project';

/**
 * Changes the owner of a task and adjusts workload allocation cleanly.
 * If the old owner was the primary contributor, their hours are transferred
 * to the new owner to keep the workload distribution coherent.
 * No transfer to/from « À confirmer » (hoursToConfirm stays for manual allocation).
 */
export function changeTaskOwner(
  task: Task,
  newOwner: OwnerId,
  transferHours: boolean = true
): Task {
  if (task.owner === newOwner) return task;

  const oldOwner = task.owner;
  const newHours = { ...task.hours };

  if (transferHours && oldOwner !== OWNER_TBC && newOwner !== OWNER_TBC) {
    const oldOwnerHours = task.hours[oldOwner] || 0;
    const newOwnerHours = task.hours[newOwner] || 0;

    // If newOwner has 0h and oldOwner had hours, transfer them
    if (newOwnerHours === 0 && oldOwnerHours > 0) {
      newHours[newOwner] = oldOwnerHours;
      newHours[oldOwner] = 0;
    } else if (oldOwnerHours > 0 && newOwnerHours > 0) {
      // If both had hours, swap primary allocation
      newHours[newOwner] = oldOwnerHours;
      newHours[oldOwner] = newOwnerHours;
    }
  }

  return {
    ...task,
    owner: newOwner,
    hours: newHours,
  };
}
