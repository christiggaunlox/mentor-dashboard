"use client"

import React, { useState, useEffect, useMemo } from "react";
import { format, addHours, isSameDay, parseISO } from "date-fns";
import {
    Calendar as CalendarIcon,
    Video,
    MoreVertical,
    Clock,
    User,
    Loader2,
    RefreshCcw,
    X
} from "lucide-react";
import { toast } from "react-toastify";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
    // Initialize date as undefined so we show ALL classes by default
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [allSchedules, setAllSchedules] = useState<BackendScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

            if (!res.ok) {
                if (res.status === 401) throw new Error("Unauthorized");
                throw new Error("Failed to fetch classes");
            }

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

    const displayedClasses = useMemo(() => {
        let dataToDisplay = allSchedules;

        // If a date is selected, filter by that date
        if (date) {
            dataToDisplay = allSchedules.filter((item) => {
                if (!item.schedule) return false;
                return isSameDay(parseISO(item.schedule), date);
            });
        }

        // Always sort by time (Earliest first)
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
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Manage your mentorship schedule.</p>
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
                                            const endTime = addHours(startTime, 1);

                                            return (
                                                <Card key={session._id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
                                                    <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">

                                                        {/* Details */}
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {/* Show Date in list if showing ALL sessions */}
                                                                {!date && (
                                                                    <div className="flex items-center gap-1.5 text-slate-700 bg-slate-200 px-2 py-1 rounded text-sm font-bold">
                                                                        <CalendarIcon className="h-3.5 w-3.5" />
                                                                        {format(startTime, "MMM dd")}
                                                                    </div>
                                                                )}
                                                                {session.classStatus ? (
                                                                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Completed</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Upcoming</Badge>
                                                                )}
                                                            </div>

                                                            <h3 className="font-semibold text-lg text-slate-900">
                                                                {session.topic}
                                                            </h3>

                                                            {/* Course Name(s) */}
                                                            {session.mentorCourses?.length > 0 && (
                                                                <p className="text-sm text-slate-600 mt-1">
                                                                    <span className="font-medium text-slate-700">Course:</span>{" "}
                                                                    {getCourseNames(session)}
                                                                </p>
                                                            )}

                                                            {/* Starts at */}
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
                                                                <Separator orientation="vertical" className="h-4" />
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
        </div>
    );
}