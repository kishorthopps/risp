import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any | null;
}

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ open, onOpenChange, user }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
      </DialogHeader>
      {user ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Name:</span> {user.name || "-"}
            </div>
            <div>
              <span className="font-semibold">Email:</span> {user.email || "-"}
            </div>
            <div>
              <span className="font-semibold">Mobile:</span> {user.mobile || user.extras?.mobile || "-"}
            </div>
            <div>
              <span className="font-semibold">Aadhaar:</span> {user.aadhaar || user.extras?.aadhaar || "-"}
            </div>
            <div>
              <span className="font-semibold">Date of Birth:</span> {user.dob || user.extras?.dob || "-"}
            </div>
            <div>
              <span className="font-semibold">Nationality:</span> {user.nationality || user.extras?.nationality || "-"}
            </div>
            <div>
              <span className="font-semibold">Address:</span> {user.address || user.extras?.address || "-"}
            </div>
            <div>
              <span className="font-semibold">Country:</span> {user.country || user.extras?.country || "-"}
            </div>
            <div>
              <span className="font-semibold">State:</span> {user.state || user.extras?.state || "-"}
            </div>
            <div>
              <span className="font-semibold">Religion:</span> {user.religion || user.extras?.religion || "-"}
            </div>
            <div>
              <span className="font-semibold">Caste:</span> {user.caste || user.extras?.caste || "-"}
            </div>
            <div>
              <span className="font-semibold">Annual Income:</span> {user.annualIncome || user.extras?.annualIncome || "-"}
            </div>
            <div>
              <span className="font-semibold">Language Preference:</span> {user.languagePreference || user.extras?.languagePreference || "-"}
            </div>
          </div>
        </div>
      ) : (
        <div>No user details available.</div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
