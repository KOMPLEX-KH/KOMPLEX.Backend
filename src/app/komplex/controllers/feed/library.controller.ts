import { Request, Response } from "express";
import { getAllBooks, getBooksById, getBooksByLesson, getBooksBySubject, getRecommendedBooks, filterBooks } from "../../services/feed/extra/library/service.js";


export const getAllBooksController = async(req: Request, res: Response )=>{
    try{
        const result = await getAllBooks();
        res.status(200).json(result);
    }catch(err){
        res.status(500).json({ message: "Failed to fetch books" });
    }
}


export const getBookByIdController = async(req: Request, res: Response )=>{
    try{
        const { id } = req.params;
        const result = await getBooksById(String(id));
        if(!result.data){
             return res.status(404).json({ message: "Book not found" });
        }
        res.status(200).json(result);
    }catch(err){
        res.status(500).json({ message: "Failed to fetch specific book" });
    }
}


export const getBooksByLessonController = async(req: Request, res: Response )=>{
    try {
        const { lessonId } = req.params;
        const result = await getBooksByLesson(String(lessonId));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch books by lesson" });
    }
}

export const getBooksBySubjectController = async(req: Request, res: Response )=>{
    try {
        const { subjectId } = req.params;
        const result = await getBooksBySubject(String(subjectId));

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch books by subject" });
    }
}

export const filterBooksController = async(req: Request, res: Response )=>{
    try{
        const {lessonId, subjectId} = req.body;
        const result = await filterBooks({
            lessonId:lessonId || "",
            subjectId:subjectId || "",
        });
        res.status(200).json(result);
    }catch(err){
        res.status(500).json({ message: "Failed to filter books" });
    }
}


