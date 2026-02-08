import { Request, Response } from "express";
import { getAllBooks, getBooksById, getBooksByLesson, getBooksBySubject, getRecommendedBooks, filterBooks } from "../../services/feed/extra/library/service.js";
import { ResponseError, getResponseError } from "@/utils/responseError.js";

export const getAllBooksController = async(req: Request, res: Response )=>{
    try{
        const result = await getAllBooks();
        return res.status(200).json(result);
    }catch(err){
        return getResponseError(res, err );
    }
}


export const getBookByIdController = async(req: Request, res: Response )=>{
    try{
        const { id } = req.params;
        const result = await getBooksById(String(id));
        if(!result.data){
             return getResponseError(res, new ResponseError("Book not found", 404));
        }
        return res.status(200).json(result);
    }catch(err){
        return getResponseError(res, err );
    }
}


export const getBooksByLessonController = async(req: Request, res: Response )=>{
    try {
        const { lessonId } = req.params;
        const result = await getBooksByLesson(String(lessonId));

        return res.status(200).json(result);
    } catch (err) {
        return getResponseError(res, err );
    }
}

export const getBooksBySubjectController = async(req: Request, res: Response )=>{
    try {
        const { subjectId } = req.params;
        const result = await getBooksBySubject(String(subjectId));

        return res.status(200).json(result);
    } catch (err) {
        return getResponseError(res, err );
    }
}

export const filterBooksController = async(req: Request, res: Response )=>{
    try{
        const {lessonId, subjectId} = req.body;
        const result = await filterBooks({
            lessonId:lessonId || "",
            subjectId:subjectId || "",
        });
        return res.status(200).json(result);
    }catch(err){
        return getResponseError(res, err );
    }
}


