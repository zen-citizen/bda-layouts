import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

function AboutDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose} className="text-sm">
        <DialogHeader>
          <DialogTitle>About This Project</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground mt-2">
          An interactive map of BDA layouts across Bangalore — approved,
          allotted, and unauthorized. Find out what category your layout falls
          under.
        </p>

        <div className="mt-4">
          <h3 className="font-semibold">Data Source</h3>
          <p className="text-muted-foreground mt-1">BDA</p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Disclaimer</h3>
          <p className="text-muted-foreground mt-1">
            This page is an independent, citizen-led volunteer effort by Zen
            Citizen, created with data provided by BDA. Zen Citizen makes no
            representation or warranty regarding the accuracy or completeness of
            the information presented.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Made by Zen Citizen</h3>
          <p className="text-muted-foreground mt-1">
            Zen Citizen is a volunteer-led initiative that helps citizens
            navigate government bureaucracy in Bangalore. We build practical
            tools and guides to make civic processes more transparent and
            accessible.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Links</h3>
          <ul className="mt-1 space-y-1">
            <li>
              <a
                href="mailto:info@zencitizen.in"
                className="text-primary underline inline-flex items-center gap-1 hover:opacity-80"
              >
                Send your feedback <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a
                href="https://zencitizen.in"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline inline-flex items-center gap-1 hover:opacity-80"
              >
                Volunteer with Zen Citizen <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>
              <a
                href="https://github.com/zen-citizen/bda-layouts"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline inline-flex items-center gap-1 hover:opacity-80"
              >
                Open source <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AboutDialog;
