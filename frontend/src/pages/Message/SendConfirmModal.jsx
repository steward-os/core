import { ChatBubbleLeftIcon } from "@heroicons/react/24/solid";
import { Button } from "../../components/Button/Button";
import DialogPanel from "../../components/Modal/DialogPanel";

/** Roughly how a phone shows the push message: the app, the title in bold and the start of the text. */
const NotificationPreview = ({ title, body }) => (
  <div className="flex gap-3 p-3 rounded-2xl bg-gray-100 dark:bg-gray-800">
    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
      <ChatBubbleLeftIcon className="w-4 h-4" />
    </span>
    <div className="min-w-0">
      <div className="text-xs text-gray-500 dark:text-gray-400">{document.title || "Berichten"}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</div>
      <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{body}</div>
    </div>
  </div>
);

/** Before a new message goes out, as it is pushed to the members at once: to whom, and what they will see. */
const SendConfirmModal = ({ isOpen, onClose, onConfirm, groupNames, title, body }) => (
  <DialogPanel open={isOpen} onClose={onClose} title="Bericht versturen?">
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        Het bericht gaat als pushbericht naar de leden van {groupNames.join(", ")}.
      </p>
      <NotificationPreview title={title} body={body} />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        <Button type="button" onClick={onClose} color="gray" text="Annuleren" className="w-full sm:w-auto justify-center" />
        <Button type="button" onClick={onConfirm} color="blue" text="Verzenden" className="w-full sm:w-auto justify-center" />
      </div>
    </div>
  </DialogPanel>
);

export default SendConfirmModal;
