"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import { toggleFollow } from "@/actions/user.action";
import toast from "react-hot-toast";

function FollowButton({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      await toggleFollow(userId);
      toast.success("User followed successfully");
    } catch (error) {
      console.log("Error in follow button", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size={"sm"}
      variant={"secondary"}
      onClick={handleFollow}
      disabled={isLoading}
      className="w-20"
    >
      {isLoading ? <Loader2 className="w-4 animate-spin" /> : "Follow"}
    </Button>
  );
}

export default FollowButton;
