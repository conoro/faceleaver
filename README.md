# Faceleaver

Early WIP of code to do a proper download of your post info instead of the purposely hamstrung Facebook backup.

Intent is to generate a pseudo-feed-like standalone HTML page with all the quotes/links/images/thumbnails from your timeline.

Current state of play is:

* Auth flow works
* It can grab all post IDs
* It can grab text, links and image URLs
* It can grab various attachment info
* It just dumps most of that to console and IDs are returned as CSV to browser

Next steps:

* Finalise exactly what is being extracted and save to file
* Work on pulling down all the images
* Generate something visually acceptable
* Leave Facebook

LICENSE Apache-2.0

Copyright Conor O'Neill 2018, conor@conoroneill.com
