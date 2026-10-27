#include <arpa/inet.h>
#include <errno.h>
#include <netinet/in.h>
#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <time.h>
#include <unistd.h>

struct work { int port, count; const char *path, *expected; int failures; };
static void *run(void *arg) {
  struct work *w=arg;
  int fd=socket(AF_INET,SOCK_STREAM,0);
  struct sockaddr_in address={0};address.sin_family=AF_INET;address.sin_port=htons(w->port);address.sin_addr.s_addr=htonl(INADDR_LOOPBACK);
  if(fd<0 || connect(fd,(struct sockaddr*)&address,sizeof(address))!=0){w->failures++;return NULL;}
  char request[1024];int request_len=snprintf(request,sizeof(request),"GET %s HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: keep-alive\r\n\r\n",w->path);
  for(int i=0;i<w->count;i++) {
    int sent=0;
    while(sent<request_len){ssize_t n=send(fd,request+sent,request_len-sent,0);if(n<=0){w->failures++;close(fd);return NULL;}sent+=(int)n;}
    char response[16384];int used=0,body_length=-1,header_length=-1;
    while(1){
      ssize_t n=recv(fd,response+used,sizeof(response)-used-1,0);
      if(n<=0){w->failures++;close(fd);return NULL;}
      used+=(int)n;response[used]=0;
      if(header_length<0){
        char *end=strstr(response,"\r\n\r\n");
        if(end){header_length=(int)(end-response)+4;char *length=strcasestr(response,"content-length:");if(!length){w->failures++;close(fd);return NULL;}body_length=atoi(length+15);}
      }
      if(header_length>=0 && used>=header_length+body_length)break;
      if(used>=(int)sizeof(response)-1){w->failures++;close(fd);return NULL;}
    }
    if(strncmp(response,"HTTP/1.1 200",12)!=0 || body_length!=(int)strlen(w->expected) || memcmp(response+header_length,w->expected,body_length)!=0){w->failures++;close(fd);return NULL;}
  }
  close(fd);return NULL;
}
static double now(void){struct timespec t;clock_gettime(CLOCK_MONOTONIC,&t);return t.tv_sec+t.tv_nsec/1e9;}
int main(int argc,char **argv){
  if(argc!=6)return 2;
  int port=atoi(argv[1]),threads=atoi(argv[2]),count=atoi(argv[3]);
  if(threads<1||threads>64||count<threads||count%threads)return 2;
  pthread_t ids[64];struct work jobs[64];double start=now();
  for(int i=0;i<threads;i++){jobs[i]=(struct work){port,count/threads,argv[4],argv[5],0};if(pthread_create(&ids[i],NULL,run,&jobs[i])!=0)return 3;}
  int failures=0;for(int i=0;i<threads;i++){pthread_join(ids[i],NULL);failures+=jobs[i].failures;}
  double seconds=now()-start;
  printf("{\"requests\":%d,\"seconds\":%.9f,\"rps\":%.3f,\"failures\":%d}\n",count,seconds,count/seconds,failures);
  return failures?1:0;
}
