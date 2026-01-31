"use client"

import { useState, useEffect, useMemo } from 'react';
import { format, isToday, startOfToday } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-toastify";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Batch = { _id: string; name: string };
type CurriculumItem = { _id: string; topic: string };

type Course = {
    _id: string;
    course_name: string;
    batches: Batch[];
    topics: CurriculumItem[];
};


const ScheduleClasses = () => {
    // Data States
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection States
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState<string>("12:00");

    // Search States
    const [courseSearch, setCourseSearch] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /* ---------------- FETCH DATA ---------------- */
    useEffect(() => {
        const token = localStorage.getItem("mentorAccessToken");

        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/class/csoptions`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then(res => res.json())
            .then(data => {
                setCourses(data.courses);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load courses", err);
                setLoading(false);
            });
    }, []);

    /* ---------------- HELPERS & FILTERED DATA ---------------- */
    const toggle = (id: string, list: string[], setList: (val: string[]) => void) => {
        setList(list.includes(id) ? list.filter(v => v !== id) : [...list, id]);
    };

    const selectedCourseData = useMemo(() =>
        courses.filter(c => selectedCourseIds.includes(c._id)),
        [courses, selectedCourseIds]
    );

    const filteredCourses = useMemo(() =>
        courses.filter(c => c.course_name.toLowerCase().includes(courseSearch.toLowerCase())),
        [courses, courseSearch]
    );

    // Flatten topics and batches from selected courses
    const visibleTopics = selectedCourseData.flatMap(c =>
        (c.topics ?? []).map(item => ({
            id: item._id,
            name: item.topic,
            label: `${item.topic} (${c.course_name})`,
        }))
    );


    const visibleBatches = selectedCourseData.flatMap(c =>
        (c.batches ?? []).map(b => ({
            id: b._id,
            label: `${b.name} (${c.course_name})`,
        }))
    );

    /* ---------------- SUBMIT ---------------- */
    const handleSubmit = async () => {
        if (!selectedTopic || selectedBatchIds.length === 0 || !selectedDate) {
            toast.error("Please select a topic, at least one batch, and a date.");
            return;
        }

        const [hours, minutes] = selectedTime.split(":");
        const finalSchedule = new Date(selectedDate);
        finalSchedule.setHours(parseInt(hours), parseInt(minutes));

        if (isToday(selectedDate) && finalSchedule < new Date()) {
            toast.error("Cannot schedule a class in the past.");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("mentorAccessToken");
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/class/schedule-class`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseIds: selectedCourseIds,
                    batchIds: selectedBatchIds,
                    topic: selectedTopic.name,
                    schedule: finalSchedule,
                }),
            });

            if (response.ok) {
                toast.success("Schedule Request sent successfully!");
                setSelectedCourseIds([]);
                setSelectedTopic(null);
                setSelectedBatchIds([]);
                setSelectedDate(undefined);
            }
        } catch (error) {
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="max-w-2xl mx-auto p-6 border rounded-xl bg-white shadow-lg mt-10 space-y-8">
            <h2 className="text-2xl font-bold">Schedule New Class</h2>

            {/* 1. Course Selection (Grid Style) */}
            <div className="space-y-3">
                <label className="text-sm font-semibold">Select Courses</label>
                <Input
                    placeholder="Search courses..."
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                    {filteredCourses.map(course => (
                        <div key={course._id} className="flex items-center space-x-3 border rounded-lg p-3 hover:bg-slate-50 transition">
                            <Checkbox
                                checked={selectedCourseIds.includes(course._id)}
                                onCheckedChange={() => {
                                    toggle(course._id, selectedCourseIds, setSelectedCourseIds);
                                    setSelectedBatchIds([]); // Reset dependencies
                                    setSelectedTopic(null);
                                }}
                            />
                            <span className="text-sm">{course.course_name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {selectedCourseIds.length > 0 && (
                <>
                    {/* 2. Topic Selection (Single Select) */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold">Select Curriculum Topic</label>
                        <Select
                            value={selectedTopic?.id ?? ""}
                            onValueChange={(value) => {
                                const topic = visibleTopics.find(t => t.id === value);
                                if (topic) {
                                    setSelectedTopic({ id: topic.id, name: topic.name });
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a topic" />
                            </SelectTrigger>
                            <SelectContent>
                                {visibleTopics.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Batch Selection (Grid Style) */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold">Select Batches</label>

                        {visibleBatches.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground bg-slate-50">
                                No batches assigned to the mentor for the selected course(s).
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
                                {visibleBatches.map(batch => (
                                    <div
                                        key={batch.id}
                                        className="flex items-center space-x-3 border rounded-lg p-3"
                                    >
                                        <Checkbox
                                            checked={selectedBatchIds.includes(batch.id)}
                                            onCheckedChange={() =>
                                                toggle(batch.id, selectedBatchIds, setSelectedBatchIds)
                                            }
                                        />
                                        <span className="text-sm">{batch.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </>
            )}

            {/* 4. Date & Time */}
            <div className="space-y-3">
                <label className="text-sm font-semibold">Date & Time</label>
                <div className="flex gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("flex-1 justify-start", !selectedDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < startOfToday()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="flex h-10 w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                </div>
            </div>

            <Button
                onClick={handleSubmit}
                className="w-full h-12 text-lg"
                disabled={isSubmitting || selectedCourseIds.length === 0}
            >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Request Schedule"}
            </Button>
        </div>
    );
};

export default ScheduleClasses;