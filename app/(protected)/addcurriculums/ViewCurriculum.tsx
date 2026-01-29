"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle2, Circle, BookOpen, Calendar, LayoutDashboard, Edit3, Trash2, Plus, X } from "lucide-react";
import { toast } from "react-toastify";

interface CurriculumItem {
    _id: string;
    topic: string;
    status: boolean;
    date?: string;
}

interface Curriculum {
    _id: string;
    course_name: string;
    curriculum: CurriculumItem[];
    updatedAt: string;
}

export default function ViewCurriculum() {
    const [data, setData] = useState<Curriculum[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState<Curriculum | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [deletedTopicIds, setDeletedTopicIds] = useState<Set<string>>(new Set());
    const [originalCurriculum, setOriginalCurriculum] = useState<CurriculumItem[]>([]);



    const fetchCurriculum = async () => {
        const token = localStorage.getItem("mentorAccessToken");
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/course/my-curriculums`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (!res.ok) {
                throw new Error("Failed to load curriculum");
            }

            const json = await res.json();
            setData(Array.isArray(json) ? json : [json]);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error("Failed to load curriculum");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => { fetchCurriculum(); }, []);

    // --- Edit Handlers ---

    const handleStartEdit = (course: Curriculum) => {
        const deepCopy = JSON.parse(JSON.stringify(course));

        setEditingCourse(deepCopy);
        setOriginalCurriculum(course.curriculum);
        setDeletedTopicIds(new Set()); // reset deletes
        setIsDialogOpen(true);
    };

    const hasChanges = () => {
        if (!editingCourse) return false;

        // 1. Check deleted topics
        if (deletedTopicIds.size > 0) return true;

        // 2. Check added / edited topics
        if (editingCourse.curriculum.length !== originalCurriculum.length) {
            return true;
        }

        // 3. Check topic name changes
        for (let i = 0; i < originalCurriculum.length; i++) {
            const original = originalCurriculum[i];
            const current = editingCourse.curriculum[i];

            if (!current) return true;

            if (original.topic !== current.topic) {
                return true;
            }
        }

        return false;
    };


    const handleUpdateTopicName = (id: string, newName: string) => {
        if (!editingCourse) return;
        const updated = editingCourse.curriculum.map(item =>
            item._id === id ? { ...item, topic: newName } : item
        );
        setEditingCourse({ ...editingCourse, curriculum: updated });
    };

    const handleToggleDeleteTopic = (id: string) => {
        setDeletedTopicIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id); // undo delete
            } else {
                next.add(id); // mark for delete
            }
            return next;
        });
    };


    const handleAddTopic = () => {
        if (!editingCourse) return;
        const newItem: CurriculumItem = {
            _id: `temp-${Date.now()}`, // Temporary ID for client-side tracking
            topic: "",
            status: false,
        };
        setEditingCourse({ ...editingCourse, curriculum: [...editingCourse.curriculum, newItem] });
    };

    const handleSaveChanges = async () => {
        if (!editingCourse) return;

        // 🚨 DUPLICATE CHECK
        if (hasDuplicateTopics()) {
            toast.error("Topic names must be unique. Duplicate topics found.");
            return;
        }

        const token = localStorage.getItem("mentorAccessToken");

        try {
            const payload = {
                courseId: editingCourse._id,
                curriculum: editingCourse.curriculum
                    .filter(item => !deletedTopicIds.has(item._id))
                    .map(({ _id, ...rest }) =>
                        _id.startsWith("temp-") ? rest : { _id, ...rest }
                    ),
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/course/update-curriculum`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error("Update failed");

            await fetchCurriculum();
            setIsDialogOpen(false);
            toast.success("Curriculum updated successfully");
        } catch (err) {
            console.error("Update failed:", err);
            toast.error("Failed to update curriculum");
        }
    };


    const hasDuplicateTopics = () => {
        if (!editingCourse) return false;

        const topicNames = editingCourse.curriculum
            .filter(item => !deletedTopicIds.has(item._id)) // ignore deleted
            .map(item => item.topic.trim().toLowerCase())
            .filter(Boolean); // ignore empty strings

        return new Set(topicNames).size !== topicNames.length;
    };



    if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Academic Progress</h1>
                    <p className="text-slate-500">Manage and track your course syllabus.</p>
                </div>
            </div>

            {data.length > 0 ? (
                <div className="grid gap-8">
                    {data.map((course) => {
                        const completed = course.curriculum.filter((item) => item.status).length;
                        const total = course.curriculum.length;
                        const percentage = total > 0 ? (completed / total) * 100 : 0;

                        return (
                            <Card key={course._id} className="border-none shadow-lg ring-1 ring-slate-200">
                                <CardHeader className="bg-white rounded-t-xl border-b pb-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-blue-600 font-bold uppercase text-[10px] tracking-widest">
                                                <BookOpen size={14} /> Active Curriculum
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-2xl font-bold">{course.course_name}</CardTitle>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 gap-2 text-slate-600"
                                                    onClick={() => handleStartEdit(course)}
                                                >
                                                    <Edit3 size={14} /> Edit
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl min-w-[240px] border border-slate-100">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-slate-500 font-medium">Completion</span>
                                                <span className="font-bold text-blue-700">{Math.round(percentage)}%</span>
                                            </div>
                                            <Progress value={percentage} className="h-2" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {course.curriculum.map((item) => (
                                            <div
                                                key={item._id}
                                                className={`group flex items-center justify-between p-5 transition-all hover:bg-slate-50/50 ${item.status ? "bg-slate-50/30" : ""
                                                    }`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="flex-shrink-0">
                                                        {item.status ? (
                                                            <div className="bg-green-100 p-1.5 rounded-full">
                                                                <CheckCircle2 className="text-green-600 w-5 h-5" />
                                                            </div>
                                                        ) : (
                                                            <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-slate-200">
                                                                <Circle className="text-slate-400 w-5 h-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p
                                                            className={`text-base font-semibold ${item.status ? "text-slate-400 line-through" : "text-slate-800"
                                                                }`}
                                                        >
                                                            {item.topic}
                                                        </p>
                                                        {item.date && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                                                <Calendar size={12} />
                                                                <span>
                                                                    {new Date(item.date).toLocaleDateString(undefined, {
                                                                        month: "short",
                                                                        day: "numeric",
                                                                        year: "numeric",
                                                                    })}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <Badge
                                                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${item.status
                                                        ? "bg-green-500/10 text-green-600 border-none"
                                                        : "bg-slate-100 text-slate-400 border-none"
                                                        }`}
                                                >
                                                    {item.status ? "Completed" : "Upcoming"}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 border-dashed border-2 rounded-2xl">Empty</div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Curriculum: {editingCourse?.course_name}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {editingCourse?.curriculum.map((item) => {
                            const isMarkedForDelete = deletedTopicIds.has(item._id);

                            return (
                                <div
                                    key={item._id}
                                    className={`flex items-center gap-3 rounded-md p-2 transition-all ${isMarkedForDelete
                                        ? "bg-red-50 border border-red-200"
                                        : "hover:bg-slate-50"
                                        }`}
                                >
                                    {/* Status Icon */}
                                    <div className="flex-shrink-0">
                                        {item.status ? (
                                            <CheckCircle2 className="text-green-500 w-5 h-5" />
                                        ) : (
                                            <Circle className="text-slate-300 w-5 h-5" />
                                        )}
                                    </div>

                                    {/* Topic Input */}
                                    <Input
                                        value={item.topic}
                                        disabled={item.status || isMarkedForDelete}
                                        onChange={(e) => {
                                            if (item.status) return; // extra safety
                                            handleUpdateTopicName(item._id, e.target.value);
                                        }}
                                        placeholder="Topic name..."
                                        className={`flex-grow ${item.status
                                            ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                                            : ""
                                            } ${isMarkedForDelete
                                                ? "line-through text-red-500 bg-red-50 border-red-200"
                                                : ""
                                            }`}
                                    />


                                    {/* Delete / Undo Button */}
                                    {!item.status && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                handleToggleDeleteTopic(item._id)
                                            }
                                            className={
                                                isMarkedForDelete
                                                    ? "text-green-600 hover:text-green-700"
                                                    : "text-slate-400 hover:text-red-500"
                                            }
                                        >
                                            {isMarkedForDelete ? (
                                                <X size={16} />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add Topic Button */}
                        <Button
                            variant="outline"
                            className="w-full border-dashed gap-2"
                            onClick={handleAddTopic}
                        >
                            <Plus size={16} /> Add New Topic
                        </Button>
                    </div>


                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleSaveChanges}
                            disabled={!hasChanges()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Changes
                        </Button>

                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}