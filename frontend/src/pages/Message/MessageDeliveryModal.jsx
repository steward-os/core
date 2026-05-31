import { CheckCircleIcon, UserIcon } from "@heroicons/react/24/outline";
import { Button } from "../../components/Button/Button";
import DialogPanel from "../../components/Modal/DialogPanel";

const MessageDeliveryModal = ({ isOpen, onClose, deliveryInfo }) => {
  if (!deliveryInfo) return null;

  const { subscribed, total, hasGroups } = deliveryInfo;
  const subscribedCount = subscribed.length;
  const notSubscribedCount = hasGroups && total !== null ? total - subscribedCount : null;

  return (
    <DialogPanel open={isOpen} onClose={onClose} title="Bericht verstuurd">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {hasGroups
              ? `Het bericht is verstuurd als pushbericht naar ${subscribedCount} van de ${total} leden in de geselecteerde groepen.`
              : `Het bericht is verstuurd als pushbericht naar ${subscribedCount} gebruiker${subscribedCount !== 1 ? "s" : ""} met ingeschakelde pushnotificaties.`}
          </p>
        </div>

        {subscribed.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Pushbericht ontvangen ({subscribedCount})
            </p>
            <ul className="space-y-1 max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
              {subscribed.map((user) => (
                <li key={user.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-1">
                  <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  {user.name || user.username || user.email || "Onbekende gebruiker"}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            Geen gebruikers hebben pushnotificaties ingeschakeld.
          </p>
        )}

        {notSubscribedCount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {notSubscribedCount} {notSubscribedCount === 1 ? "lid heeft" : "leden hebben"} geen pushnotificaties ingeschakeld.
          </p>
        )}

        <Button
          type="button"
          onClick={onClose}
          color="blue"
          text="Sluiten"
          className="w-full justify-center mt-2"
        />
      </div>
    </DialogPanel>
  );
};

export default MessageDeliveryModal;
