"use client"

import { cn } from "@/lib/utils";
import React, { useState, useEffect, useMemo } from "react";
import { format, isSameDay, parseISO, startOfToday, isPast } from "date-fns"; // Added isPast

import {
    Calendar as CalendarIcon,
    Clock,
    User,
    Loader2,
    CalendarDays,
    XCircle,
    AlertTriangle,
    AlertCircle // Added AlertCircle
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import { toast } from "react-toastify";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/lib/authStore";

// --- Types ---
interface BackendScheduleItem {
    _id: string;
    topic: string;
    schedule: string;
    classStatus: boolean;
    scheduleStatus: "requested" | "approved" | "rejected";
    mentorBatches: { _id: string; name: string }[];
    mentorCourses: { _id: string; course_name: string }[];
    meetingLink?: string;
}

export default function Dashboard() {
    // --- State ---
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [allSchedules, setAllSchedules] = useState<BackendScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Dialog States
    const [selectedClass, setSelectedClass] = useState<BackendScheduleItem | null>(null);
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);

    // Reschedule Form State
    const [selectedRescheduleDate, setSelectedRescheduleDate] = useState<Date | undefined>(undefined);
    const [selectedRescheduleTime, setSelectedRescheduleTime] = useState("10:00");

    const { user } = useAuthStore();

    // --- Fetching ---
    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("mentorAccessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/class/mentorupcoming`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to fetch classes");

            const data = await res.json();
            setAllSchedules(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load schedule");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    // --- Actions ---

    const handleRescheduleSubmit = async () => {
        if (!selectedClass || !selectedRescheduleDate || !selectedRescheduleTime) return;

        setIsActionLoading(true);

        try {
            const [hours, minutes] = selectedRescheduleTime.split(":");

            const finalDate = new Date(selectedRescheduleDate);
            finalDate.setHours(Number(hours));
            finalDate.setMinutes(Number(minutes));
            finalDate.setSeconds(0);

            const token = localStorage.getItem("mentorAccessToken");

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/class/reschedule`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        classId: selectedClass._id,
                        newSchedule: finalDate.toISOString(),
                    }),
                }
            );

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to reschedule class");
            }

            toast.success("Class rescheduled successfully!");
            setIsRescheduleOpen(false);
            fetchSchedules();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error rescheduling class");
        } finally {
            setIsActionLoading(false);
        }
    };


    const handleCancelSubmit = async () => {
        if (!selectedClass) return;

        setIsActionLoading(true);
        try {
            const token = localStorage.getItem("mentorAccessToken");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/class/${selectedClass._id}/cancel`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Failed to cancel class");

            toast.success("Class cancelled successfully");
            setIsCancelOpen(false);
            fetchSchedules();
        } catch (error) {
            console.error(error);
            toast.error("Error cancelling class");
        } finally {
            setIsActionLoading(false);
        }
    };

    const openRescheduleDialog = (session: BackendScheduleItem) => {
        setSelectedClass(session);
        const current = new Date(session.schedule);
        setSelectedRescheduleDate(current);
        const hours = String(current.getHours()).padStart(2, "0");
        const minutes = String(current.getMinutes()).padStart(2, "0");
        setSelectedRescheduleTime(`${hours}:${minutes}`);
        setIsRescheduleOpen(true);
    };

    const openCancelDialog = (session: BackendScheduleItem) => {
        setSelectedClass(session);
        setIsCancelOpen(true);
    };

    // --- Memoization ---
    const displayedClasses = useMemo(() => {
        let dataToDisplay = allSchedules;

        if (date) {
            dataToDisplay = allSchedules.filter((item) => {
                if (!item.schedule) return false;
                return isSameDay(parseISO(item.schedule), date);
            });
        }

        return [...dataToDisplay].sort((a, b) =>
            new Date(a.schedule).getTime() - new Date(b.schedule).getTime()
        );

    }, [date, allSchedules]);

    // --- Helpers ---
    const getTargetName = (session: BackendScheduleItem) => {
        if (session.mentorBatches?.length > 0) return session.mentorBatches[0].name;
        if (session.mentorCourses?.length > 0) return session.mentorCourses[0].course_name;
        return "1:1 Session";
    };

    const getCourseNames = (session: BackendScheduleItem) => {
        if (!session.mentorCourses?.length) return null;
        return session.mentorCourses.map(c => c.course_name).join(", ");
    };

    return (
        <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        👋 Hi{user?.name ? `, ${user.name}` : ""}
                    </h1>
                    <p className="text-slate-500">
                        Manage your mentorship schedule.
                    </p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-12 h-full items-start">
                {/* --- LEFT: Calendar --- */}
                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                    <Card className="shadow-sm border-slate-200 sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Calendar</CardTitle>
                            <CardDescription>
                                {date ? "Filter applied by date" : "Showing all upcoming classes"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-sm w-full flex justify-center"
                                modifiers={{
                                    hasEvent: (day) =>
                                        allSchedules.some(s =>
                                            isSameDay(parseISO(s.schedule), day)
                                        ),
                                }}
                                modifiersClassNames={{
                                    hasEvent:
                                        "relative after:content-[''] after:absolute after:top-1 after:right-1 after:w-1.5 after:h-1.5 after:bg-blue-500 after:rounded-full"
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* --- RIGHT: Class List --- */}
                <div className="md:col-span-12 lg:col-span-8">
                    <Card className="h-full border-none shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    {date ? (
                                        <>Schedule for <span className="text-blue-600">{format(date, "MMMM do")}</span></>
                                    ) : (
                                        <span>All Upcoming Sessions</span>
                                    )}
                                </CardTitle>
                                <Badge variant="secondary" className="px-3 py-1">
                                    {displayedClasses.length} Sessions
                                </Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="px-0">
                            <ScrollArea className="h-[650px] pr-4">
                                {isLoading && allSchedules.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                        <p>Fetching schedule...</p>
                                    </div>
                                ) : displayedClasses.length > 0 ? (
                                    <div className="space-y-4">
                                        {displayedClasses.map((session) => {
                                            const startTime = new Date(session.schedule);
                                            // Check if expired (Past date AND not completed)
                                            const isExpired = isPast(startTime) && !session.classStatus;

                                            return (
                                                <Card
                                                    key={session._id}
                                                    className={cn(
                                                        "hover:shadow-md transition-shadow duration-200 border-l-4",
                                                        // Dynamic Border Logic
                                                        session.classStatus
                                                            ? "border-l-green-500 opacity-60 bg-slate-50"
                                                            : isExpired
                                                                ? "border-l-red-500 bg-red-50/10"
                                                                : "border-l-blue-500"
                                                    )}
                                                >
                                                    <div className="p-6">
                                                        <div className="flex flex-col sm:flex-row gap-6 items-end justify-between">

                                                            {/* Details Section */}
                                                            <div className="flex-1 space-y-1">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    {!date && (
                                                                        <div className="flex items-center gap-1.5 text-slate-700 bg-slate-200 px-2 py-1 rounded text-sm font-bold">
                                                                            <CalendarIcon className="h-3.5 w-3.5" />
                                                                            {format(startTime, "MMM dd")}
                                                                        </div>
                                                                    )}

                                                                    {/* Status Badges */}
                                                                    {session.classStatus ? (
                                                                        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                                                                            Completed
                                                                        </Badge>
                                                                    ) : isExpired ? (
                                                                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 border shadow-none">
                                                                            <AlertCircle className="w-3 h-3 mr-1" /> Overdue
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                                                                            Upcoming
                                                                        </Badge>
                                                                    )}
                                                                </div>

                                                                <h3 className="font-semibold text-lg text-slate-900">
                                                                    {session.topic}
                                                                </h3>

                                                                {session.mentorCourses?.length > 0 && (
                                                                    <p className="text-sm text-slate-600 mt-1">
                                                                        <span className="font-medium text-slate-700">Course:</span>{" "}
                                                                        {getCourseNames(session)}
                                                                    </p>
                                                                )}

                                                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                                    <Clock className="h-3.5 w-3.5" />
                                                                    <span>
                                                                        Starts at{" "}
                                                                        <span className="font-medium text-slate-700">
                                                                            {format(startTime, "h:mm a")}
                                                                        </span>
                                                                    </span>
                                                                </p>

                                                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                                                                                <User className="h-3 w-3" />
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span>{getTargetName(session)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Actions Buttons */}
                                                            <div className="flex flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="gap-2 text-slate-600"
                                                                    onClick={() => openRescheduleDialog(session)}
                                                                    disabled={session.classStatus}
                                                                >
                                                                    <CalendarDays className="h-4 w-4" />
                                                                    Reschedule
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                    onClick={() => openCancelDialog(session)}
                                                                    disabled={session.classStatus}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-slate-50/50">
                                        <div className="p-4 bg-slate-100 rounded-full mb-4">
                                            <CalendarIcon className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900">No classes found</h3>
                                        <p className="text-slate-500 max-w-sm text-center mb-6">
                                            {date ? "No sessions scheduled for this specific date." : "You have no upcoming classes."}
                                        </p>
                                        {date && (
                                            <Button variant="outline" onClick={() => setDate(undefined)}>
                                                View All Sessions
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- Dialogs --- */}

            {/* Reschedule Dialog */}
            <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reschedule Class</DialogTitle>
                        <DialogDescription>
                            Choose a new date and time for <strong>{selectedClass?.topic}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {/* Date Picker */}
                        <div className="grid gap-2">
                            <Label>New Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "justify-start text-left font-normal",
                                            !selectedRescheduleDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {selectedRescheduleDate ? format(selectedRescheduleDate, "PPP") : "Pick a date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedRescheduleDate}
                                        onSelect={setSelectedRescheduleDate}
                                        disabled={(date) => date < startOfToday()}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time Picker */}
                        <div className="grid gap-2">
                            <Label>New Time</Label>
                            <input
                                type="time"
                                value={selectedRescheduleTime}
                                onChange={(e) => setSelectedRescheduleTime(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRescheduleOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleRescheduleSubmit}
                            disabled={
                                isActionLoading ||
                                !selectedRescheduleDate ||
                                !selectedRescheduleTime
                            }
                        >
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Request Reschedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <AlertTriangle className="h-5 w-5" />
                            <DialogTitle>Cancel Class?</DialogTitle>
                        </div>
                        <DialogDescription>
                            Are you sure you want to cancel the session <strong>{selectedClass?.topic}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsCancelOpen(false)}>Keep Class</Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelSubmit}
                            disabled={isActionLoading}
                        >
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Cancel Class
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}