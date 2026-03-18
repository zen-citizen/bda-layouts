import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

function AboutDialog({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose} className="text-sm">
        <DialogHeader>
          <DialogTitle>About This Tool</DialogTitle>
        </DialogHeader>

        <p className="text-muted-foreground mt-2">
          An interactive map of allotted and approved BDA layouts dated Oct
          2025.
        </p>

        <div className="mt-4">
          <h3 className="font-semibold">Data Source</h3>
          <p className="text-muted-foreground mt-1">
            <a
              href="https://bdakarnataka.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              BDA
            </a>
          </p>
          <p className="mt-2 text-muted-foreground">
            <strong>Note</strong>: Map boundaries are for reference only and not
            meant for legal use. Approved Layout drawings must be verified from
            the concerned authority - BDA or GBA (if the layout has been handed
            over).
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Disclaimer</h3>
          <p className="text-muted-foreground mt-1">
            This page is an independent, citizen-led volunteer effort by{" "}
            <a
              href="https://zencitizen.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Zen Citizen
            </a>
            , a volunteer-led initiative that helps citizens navigate government
            bureaucracy. Data has been provided by BDA. Zen Citizen makes no
            representation or warranty regarding the accuracy or completeness of
            the information presented.
          </p>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Links</h3>
          <ul className="mt-1 space-y-1">
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
            <li>
              <a
                href="mailto:info@zencitizen.in"
                className="text-primary underline inline-flex items-center gap-1 hover:opacity-80"
              >
                Share feedback <ExternalLink className="h-3 w-3" />
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
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AboutDialog;
